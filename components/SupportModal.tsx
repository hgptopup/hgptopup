import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SUPPORT_CHANNELS = [
  {
    name: 'WhatsApp',
    handle: '+8801878666388',
    url: 'https://wa.me/8801878666388',
    icon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .01 5.403.007 12.04c0 2.123.554 4.197 1.606 6.044L0 24l6.102-1.6c1.789.976 3.804 1.49 5.854 1.491h.005c6.632 0 12.032-5.403 12.035-12.04a11.808 11.808 0 00-3.417-8.436z"/>
      </svg>
    ),
    color: 'hover:text-[#25D366]',
    borderColor: 'hover:border-[#25D366]/50',
    glowColor: 'group-hover:shadow-[#25D366]/20',
    iconColor: 'text-[#25D366]'
  },
  {
    name: 'Telegram',
    handle: '@shuvomridha02',
    url: 'https://t.me/shuvomridha02',
    icon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.14-.25.25-.51.25l.213-3.054 5.56-5.022c.24-.213-.054-.33-.373-.12l-6.87 4.326-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.458c.538-.196 1.006.128.832.941z"/>
      </svg>
    ),
    color: 'hover:text-[#0088cc]',
    borderColor: 'hover:border-[#0088cc]/50',
    glowColor: 'group-hover:shadow-[#0088cc]/20',
    iconColor: 'text-[#0088cc]'
  },
  {
    name: 'Messenger',
    handle: 'HGP HQ',
    url: 'https://m.me/697741423426390',
    icon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 0C5.3 0 0 4.9 0 11.2c0 3.6 1.6 6.8 4.1 8.9V24l3.8-2.1c1.3.4 2.7.6 4.1.6 6.6 0 12-4.9 12-11.2S18.7 0 12 0zm1.3 14.5l-3-3.2-5.8 3.2 6.4-6.8 3 3.2 5.8-3.2-6.4 6.8z"/>
      </svg>
    ),
    color: 'hover:text-[#00B2FF]',
    borderColor: 'hover:border-[#00B2FF]/50',
    glowColor: 'group-hover:shadow-[#00B2FF]/20',
    iconColor: 'text-[#00B2FF]'
  }
];

const SupportModal: React.FC<SupportModalProps> = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-md z-[100]"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 m-auto w-full max-w-lg h-fit bg-[#0B0B0F]/90 backdrop-blur-2xl border border-[#FAF9F6]/10 rounded-[2.5rem] z-[110] overflow-hidden shadow-2xl"
          >
            <div className="p-8 md:p-10">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-3xl font-display font-bold mb-2 text-[#FAF9F6]">
                    Hasibul <span className="text-red-600">Game Point</span>
                  </h2>
                  <p className="text-[#00B2FF] text-sm font-medium">Connect directly with our HGP operators.</p>
                </div>
                <button onClick={onClose} className="p-3 hover:bg-[#FAF9F6]/5 rounded-2xl transition-colors text-[#FAF9F6]">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {SUPPORT_CHANNELS.map((channel, i) => (
                  <motion.a
                    key={channel.name}
                    href={channel.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className={`group block bg-[#FAF9F6]/5 p-6 rounded-3xl border border-[#FAF9F6]/5 ${channel.borderColor} ${channel.color} transition-all shadow-xl ${channel.glowColor}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-5">
                        <div className={`w-12 h-12 bg-[#FAF9F6]/5 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform ${channel.iconColor}`}>
                          {channel.icon}
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-[#FAF9F6] group-hover:text-inherit transition-colors">{channel.name}</h4>
                          <p className={`text-[10px] font-bold uppercase tracking-widest ${channel.iconColor} opacity-80`}>{channel.handle}</p>
                        </div>
                      </div>
                      <div className="p-2 opacity-0 group-hover:opacity-100 transition-opacity text-[#FAF9F6]">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </div>
                    </div>
                  </motion.a>
                ))}
              </div>

              <div className="mt-10 pt-8 border-t border-[#FAF9F6]/5 text-center">
                <p className="text-[10px] font-bold text-[#FAF9F6] uppercase tracking-[0.3em]">Operational 24/7 • Gold Shield Verified</p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SupportModal;