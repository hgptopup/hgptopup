
import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const SUPPORT_CHANNELS = [
  {
    name: 'WhatsApp',
    handle: '+8801878666388',
    url: 'https://wa.me/8801878666388',
    icon: (
      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
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
      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
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
      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 0C5.3 0 0 4.9 0 11.2c0 3.6 1.6 6.8 4.1 8.9V24l3.8-2.1c1.3.4 2.7.6 4.1.6 6.6 0 12-4.9 12-11.2S18.7 0 12 0zm1.3 14.5l-3-3.2-5.8 3.2 6.4-6.8 3 3.2 5.8-3.2-6.4 6.8z"/>
      </svg>
    ),
    color: 'hover:text-[#00B2FF]',
    borderColor: 'hover:border-[#00B2FF]/50',
    glowColor: 'group-hover:shadow-[#00B2FF]/20',
    iconColor: 'text-[#00B2FF]'
  }
];

const Support: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0B0B0F] pt-32 pb-20 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-red-600/10 blur-[120px] rounded-full -z-10" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full -z-10" />

      <div className="max-w-4xl mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-6xl font-display font-bold text-[#FAF9F6] mb-6"
          >
            Elite <span className="text-red-600">Support</span> Ops
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 text-lg max-w-2xl mx-auto"
          >
            Connect directly with our HGP operators for instant tactical assistance. 
            Operational 24/7 across all sectors.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {SUPPORT_CHANNELS.map((channel, i) => (
            <motion.a
              key={channel.name}
              href={channel.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 + 0.3 }}
              className={`group bg-[#FAF9F6]/5 p-8 rounded-[2.5rem] border border-[#FAF9F6]/10 ${channel.borderColor} ${channel.color} transition-all shadow-2xl flex flex-col items-center text-center ${channel.glowColor}`}
            >
              <div className={`w-20 h-20 bg-[#FAF9F6]/5 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ${channel.iconColor}`}>
                {channel.icon}
              </div>
              <h4 className="text-2xl font-bold text-[#FAF9F6] group-hover:text-inherit transition-colors mb-2">{channel.name}</h4>
              <p className={`text-xs font-bold uppercase tracking-widest ${channel.iconColor} opacity-80 mb-6`}>{channel.handle}</p>
              
              <div className="mt-auto w-full py-3 bg-[#FAF9F6]/5 rounded-xl text-[#FAF9F6] font-bold text-xs uppercase tracking-widest group-hover:bg-red-600 transition-all">
                Connect Now
              </div>
            </motion.a>
          ))}
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-20 p-10 bg-gradient-to-br from-[#FAF9F6]/5 to-transparent border border-[#FAF9F6]/10 rounded-[3rem] text-center"
        >
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-red-600/20 rounded-full border border-red-600/30 text-red-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-6">
            <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
            Live Status: Operational
          </div>
          <h3 className="text-2xl font-bold text-[#FAF9F6] mb-4">Need immediate help?</h3>
          <p className="text-slate-400 text-sm mb-8 max-w-md mx-auto">
            Our average response time is under 5 minutes. For order-related queries, please have your Order ID ready.
          </p>
          <button 
            onClick={() => {
              navigate('/');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="px-8 py-4 bg-red-600 hover:bg-red-700 text-[#FAF9F6] font-bold rounded-2xl transition-all shadow-xl shadow-red-600/20 uppercase tracking-widest text-xs"
          >
            Back to Command Center
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default Support;
