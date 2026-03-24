from google import genai
from google.genai import types
from app.config import get_settings
from app.models.requests import ContentFormat
import json
import re
import asyncio
import logging

logger = logging.getLogger(__name__)

# Strict pattern: only allow Gemini file references (files/XXXXX)
GEMINI_FILE_PATTERN = re.compile(r"^files/[a-zA-Z0-9_-]+$")


# Platform-specific prompt templates
PLATFORM_PROMPTS = {
    ContentFormat.LINKEDIN: """You are an expert LinkedIn content strategist. Based on the following video transcript/content, 
create a professional LinkedIn post that:
- Starts with a powerful hook (first line should stop the scroll)
- Uses short paragraphs (1-2 sentences max)
- Includes relevant insights and takeaways
- Ends with a clear call-to-action
- Uses line breaks for readability
- Is between 1000-1300 characters
- Does NOT use hashtags in the main text (add 3-5 at the very end)
- Feels authentic, not AI-generated

{voice_instruction}

VIDEO CONTENT:
{transcript}

{custom_instruction}

Return ONLY the LinkedIn post text, nothing else.""",

    ContentFormat.X_THREAD: """You are a viral Twitter/X thread writer. Based on the following video content,
create an engaging X thread that:
- Has 5-8 tweets
- Tweet 1: A powerful hook that creates curiosity (under 280 chars)
- Each tweet: One clear point with a smooth transition to the next
- Uses numbers, stats, or surprising facts when possible
- Last tweet: A CTA (follow, retweet, bookmark)
- Each tweet is under 280 characters
- Format: Number each tweet (1/, 2/, etc.)
- Include 🧵 in the first tweet

{voice_instruction}

VIDEO CONTENT:
{transcript}

{custom_instruction}

Return ONLY the thread text with numbered tweets, each separated by a blank line.""",

    ContentFormat.INSTAGRAM: """You are an Instagram content expert. Based on the following video content,
create an engaging Instagram caption that:
- Starts with a catchy first line (this shows in preview)
- Tells a micro-story or shares a key insight
- Uses emoji naturally (not excessively)
- Includes a clear call-to-action (save, share, comment)
- Is 150-300 words
- Ends with a block of 20-25 relevant, high-traffic hashtags
- Has a good mix of broad and niche hashtags

{voice_instruction}

VIDEO CONTENT:
{transcript}

{custom_instruction}

Return ONLY the Instagram caption text, nothing else.""",

    ContentFormat.YOUTUBE: """You are a YouTube SEO specialist. Based on the following video content,
create a YouTube video description that:
- First 2 lines: Compelling summary (shows in search results)
- Key timestamps (estimate based on content flow): 0:00, etc.
- 3-4 paragraph summary of the video content
- Relevant links section (use placeholder [LINK] markers)
- "About this channel" section
- 15-20 relevant tags/keywords at the bottom
- Is between 800-1500 characters

{voice_instruction}

VIDEO CONTENT:
{transcript}

{custom_instruction}

Return ONLY the YouTube description text, nothing else.""",

    ContentFormat.BLOG: """You are a professional blog writer and SEO expert. Based on the following video content,
create a structured blog post that:
- Has an SEO-friendly title (H1)
- Includes a compelling introduction (hook + context)
- Uses H2 and H3 headings for structure
- Has 800-1200 words
- Includes bullet points and numbered lists where appropriate
- Ends with a conclusion and call-to-action
- Is formatted in Markdown
- Feels natural and engaging, not robotic

{voice_instruction}

VIDEO CONTENT:
{transcript}

{custom_instruction}

Return ONLY the blog post in Markdown format, nothing else.""",
}

CHATBOT_SYSTEM_PROMPT = """You are Echo, the AI content assistant for EchoChamber.

CRITICAL FORMATTING RULES (you MUST follow these):
- Write in PLAIN TEXT only. Never use markdown syntax such as **, *, ##, `, or any other formatting symbols.
- Do NOT use bullet points with asterisks. Use short dashes (-) if you need a list.
- Use at most ONE emoji per response, and only at the end of the message. Skip emojis entirely if the response is factual or technical.
- Keep responses SHORT: 2-4 sentences for simple questions, up to 6 sentences max for detailed ones.
- Never repeat what the user already knows. Go straight to the answer.
- Use natural conversational language. No filler phrases like "Great question!" or "That's a wonderful thought!".
- When listing items, put each on its own line with a dash prefix.

What you help with:
- How the platform works
- Tips for better content creation
- Content strategy for different social platforms
- Questions about supported formats, file sizes, limits
- Refining generated content

Platform facts:
- Supported video formats: MP4, MOV, WebM
- Guest users get 1 free generation, up to 500MB
- Registered users get 3 generations per day, up to 3GB
- Output formats: LinkedIn post, X thread, Instagram caption, YouTube description, Blog article
- Users can provide writing style examples for personalized output

If asked about something unrelated to content creation, briefly redirect to how you can help with their content needs."""


class AIService:
    def __init__(self):
        settings = get_settings()
        if settings.gemini_api_key:
            self.client = genai.Client(api_key=settings.gemini_api_key)
            self.model_name = settings.gemini_model_name
        else:
            self.client = None
            self.model_name = None

    async def generate_content(
        self,
        transcript: str,
        formats: list[ContentFormat],
        voice_examples: list[str] = None,
        custom_instructions: str = "",
    ) -> dict[str, dict]:
        """Generate content for the specified platforms."""
        if not self.client:
            raise ValueError("Gemini API key not configured")

        voice_instruction = ""
        if voice_examples and len(voice_examples) > 0:
            # Limit each voice example length to prevent prompt injection via huge inputs
            safe_examples = [ex[:2000] for ex in voice_examples[:3]]
            examples_text = "\n---\n".join(safe_examples)
            voice_instruction = f"""IMPORTANT - MATCH THIS WRITING STYLE:
The creator writes like this. Match their tone, vocabulary, and style:

{examples_text}

--- END OF STYLE EXAMPLES ---"""

        custom_instruction = ""
        if custom_instructions:
            # Limit custom instructions length
            safe_instructions = custom_instructions[:500]
            custom_instruction = f"ADDITIONAL INSTRUCTIONS: {safe_instructions}"

        results = {}
        for fmt in formats:
            prompt = PLATFORM_PROMPTS[fmt].format(
                transcript=transcript[:15000],  # Limit transcript length
                voice_instruction=voice_instruction,
                custom_instruction=custom_instruction,
            )

            try:
                response = self.client.models.generate_content(
                    model=self.model_name,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        temperature=0.7,
                        top_p=0.9,
                        max_output_tokens=4096,
                    ),
                )
                content_text = response.text.strip()

                # Calculate metadata
                word_count = len(content_text.split())
                char_count = len(content_text)

                # Generate a title
                title = self._generate_title(fmt, content_text)

                results[fmt.value] = {
                    "format": fmt.value,
                    "content": content_text,
                    "title": title,
                    "character_count": char_count,
                    "word_count": word_count,
                }
            except Exception as e:
                error_msg = str(e)
                if "429" in error_msg or "RESOURCE_EXHAUSTED" in error_msg or "quota" in error_msg.lower():
                    logger.warning("Gemini API Quota/429 Exception hit: %s", error_msg)
                    raise ValueError("Generation limit reached. Please contact the developer in contact for more generations")
                else:
                    logger.error("Content generation error for %s: %s", fmt.value, error_msg)
                    raise ValueError(f"Failed to generate {fmt.value} content. Please try again.")

        return results

    def _generate_title(self, fmt: ContentFormat, content: str) -> str:
        """Extract or create a title from the generated content."""
        titles = {
            ContentFormat.LINKEDIN: "LinkedIn Post",
            ContentFormat.X_THREAD: "X Thread",
            ContentFormat.INSTAGRAM: "Instagram Caption",
            ContentFormat.YOUTUBE: "YouTube Description",
            ContentFormat.BLOG: "Blog Article",
        }

        if fmt == ContentFormat.BLOG:
            # Try to extract H1 from markdown
            lines = content.split("\n")
            for line in lines:
                if line.startswith("# "):
                    return line[2:].strip()

        # Use first ~50 chars as title
        first_line = content.split("\n")[0][:60]
        return f"{titles.get(fmt, 'Content')}: {first_line}..."

    async def process_video_content(self, video_url: str) -> str:
        """
        Process video to extract transcript/content understanding.
        Uses Gemini's multimodal capability to understand video content.
        """
        if not self.client:
            raise ValueError("Gemini API key not configured")

        # Validate video_url format — only allow Gemini file references
        if not video_url or not GEMINI_FILE_PATTERN.match(video_url):
            raise ValueError(
                "Invalid video reference. Please upload a video first."
            )

        try:
            video_file = self.client.files.get(name=video_url)

            # Wait for processing asynchronously
            max_wait = 300  # 5 minute maximum wait
            waited = 0
            while video_file.state == "PROCESSING":
                if waited >= max_wait:
                    raise ValueError("Video processing timed out. Please try a shorter video.")
                await asyncio.sleep(2)
                waited += 2
                video_file = self.client.files.get(name=video_file.name)

            if video_file.state == "FAILED":
                raise ValueError("Video processing failed inside Gemini")

            # Use Gemini to transcribe and understand in background thread
            def _generate_transcript():
                return self.client.models.generate_content(
                    model=self.model_name,
                    contents=[
                        video_file,
                        """Please provide a comprehensive transcript and content analysis of this video. Include:
1. A full transcript of everything said
2. Key topics and themes discussed  
3. Main points and takeaways
4. The speaker's tone and style
5. Any notable quotes or statistics mentioned

Format the output clearly with sections."""
                    ],
                    config=types.GenerateContentConfig(
                        temperature=0.3,
                        max_output_tokens=8192,
                    ),
                )
            
            response = await asyncio.to_thread(_generate_transcript)
            
            return response.text

        except ValueError:
            # Re-raise our own validation errors
            raise
        except Exception as e:
            error_msg = str(e)
            if "429" in error_msg or "RESOURCE_EXHAUSTED" in error_msg or "quota" in error_msg.lower():
                raise ValueError("Generation limit reached. Please contact the developer in contact for more generations")
            logger.error("Video processing failed: %s", error_msg, exc_info=True)
            print(f"DEBUG: Video processing failed raw message: {error_msg}")
            raise ValueError(f"Failed to process video: {error_msg}")

    async def chat_response(
        self, messages: list[dict], context: str = ""
    ) -> tuple[str, list[str]]:
        """Generate a chatbot response with suggested follow-ups."""
        if not self.client:
            raise ValueError("Gemini API key not configured")

        # Prepare role mapping for newer SDK
        contents = []
        for msg in messages:
            role = "user" if msg["role"] == "user" else "model"
            # Sanitize content length per message
            safe_content = msg["content"][:5000]
            contents.append({"role": role, "parts": [{"text": safe_content}]})

        user_message = messages[-1]["content"][:5000]
        if context:
            safe_context = context[:2000]
            user_message = f"[Context: {safe_context}]\n\n{user_message}"

        # Generate the chat response (lower temperature for more focused answers)
        response = self.client.models.generate_content(
            model=self.model_name,
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=CHATBOT_SYSTEM_PROMPT,
                temperature=0.6,
                max_output_tokens=512,
            ),
        )

        # Clean any residual markdown out of the response
        clean_response = self._clean_chat_response(response.text)

        # Generate suggested follow-up questions
        followup_response = self.client.models.generate_content(
            model=self.model_name,
            contents=f"""Based on this conversation, suggest 3-4 short follow-up questions the user might ask.

Last user message: {messages[-1]["content"][:500]}
AI response: {clean_response[:500]}

Return ONLY the questions as plain text, one per line, no numbering, no bullets, no markdown. Each under 40 characters.""",
            config=types.GenerateContentConfig(
                temperature=0.9,
                max_output_tokens=256,
            ),
        )

        suggested = [
            self._clean_chat_response(q.strip())
            for q in followup_response.text.strip().split("\n")
            if q.strip() and len(q.strip()) < 50
        ][:4]

        return clean_response, suggested

    @staticmethod
    def _clean_chat_response(text: str) -> str:
        """Strip markdown formatting symbols from chat text so it reads as clean plain text."""
        if not text:
            return text

        cleaned = text.strip()

        # Remove markdown bold/italic markers: **text** -> text, *text* -> text
        cleaned = re.sub(r'\*\*(.+?)\*\*', r'\1', cleaned)
        cleaned = re.sub(r'\*(.+?)\*', r'\1', cleaned)

        # Remove markdown headers: ## Header -> Header
        cleaned = re.sub(r'^#{1,6}\s+', '', cleaned, flags=re.MULTILINE)

        # Remove inline code backticks: `code` -> code
        cleaned = re.sub(r'`(.+?)`', r'\1', cleaned)

        # Remove code block fences
        cleaned = re.sub(r'```[\s\S]*?```', '', cleaned)

        # Remove markdown links: [text](url) -> text
        cleaned = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', cleaned)

        # Remove leading bullet markers (*, •) and normalize to dashes
        cleaned = re.sub(r'^\s*[\*•]\s+', '- ', cleaned, flags=re.MULTILINE)

        # Collapse multiple blank lines into one
        cleaned = re.sub(r'\n{3,}', '\n\n', cleaned)

        return cleaned.strip()


# Singleton
ai_service = AIService()
