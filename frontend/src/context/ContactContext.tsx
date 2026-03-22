import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface ContactContextType {
  openContactModal: () => void;
  closeContactModal: () => void;
  isContactModalOpen: boolean;
}

const ContactContext = createContext<ContactContextType | undefined>(undefined);

export function ContactProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openContactModal = () => setIsOpen(true);
  const closeContactModal = () => setIsOpen(false);

  return (
    <ContactContext.Provider value={{ openContactModal, closeContactModal, isContactModalOpen: isOpen }}>
      {children}
    </ContactContext.Provider>
  );
}

export function useContact() {
  const context = useContext(ContactContext);
  if (!context) {
    throw new Error('useContact must be used within a ContactProvider');
  }
  return context;
}
