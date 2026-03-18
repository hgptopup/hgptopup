
import React from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';

interface FooterProps {
  onOpenTerms?: () => void;
  onOpenRefund?: () => void;
  onOpenHelp?: () => void;
  onOpenSupport?: () => void;
}

const Footer: React.FC<FooterProps> = ({ onOpenTerms, onOpenRefund, onOpenHelp, onOpenSupport }) => {
  const { logoUrl } = useStore();
  return (
    <footer className="bg-[#0B0B0F] border-t border-[#FAF9F6]/5 pt-20 pb-10 relative z-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-2">
             <div className="flex items-center space-x-2 mb-6">
              <Link to="/" className="flex items-center space-x-2">
                <span className="text-2xl font-display font-bold text-[#FAF9F6]">
                  Hasibul <span className="text-red-600">Game Point</span>
                </span>
              </Link>
            </div>
            <p className="text-slate-500 max-w-sm">
              Hasibul Game Point - The ultimate destination for gamers to recharge their favorite games instantly. Fast, secure, and reliable.
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-6 text-[#FAF9F6] uppercase tracking-widest text-sm">Support</h4>
            <ul className="space-y-4 text-slate-400">
              <li><Link to="/help" className="hover:text-red-500 transition-colors text-left font-bold block">Help Center</Link></li>
              <li><Link to="/payment" className="hover:text-red-500 transition-colors text-left font-bold block">Payment</Link></li>
              <li><Link to="/refund" className="hover:text-red-500 transition-colors text-left font-bold block">Refund Policy</Link></li>
              <li><Link to="/terms" className="hover:text-red-500 transition-colors text-left font-bold block">Terms of Service</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-6 text-[#FAF9F6] uppercase tracking-widest text-sm">Connect</h4>
            <div className="flex space-x-4 mb-8">
              <a href="https://wa.me/8801878666388" target="_blank" className="w-10 h-10 bg-[#FAF9F6]/5 border border-[#FAF9F6]/10 rounded-full flex items-center justify-center hover:bg-green-600 hover:text-[#FAF9F6] transition-colors cursor-pointer text-slate-400">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .01 5.403.007 12.04c0 2.123.554 4.197 1.606 6.044L0 24l6.102-1.6c1.789.976 3.804 1.49 5.854 1.491h.005c6.632 0 12.032-5.403 12.035-12.04a11.808 11.808 0 00-3.417-8.436z"/></svg>
              </a>
              <a href="https://t.me/shuvomridha02" target="_blank" className="w-10 h-10 bg-[#FAF9F6]/5 border border-[#FAF9F6]/10 rounded-full flex items-center justify-center hover:bg-blue-400 hover:text-[#FAF9F6] transition-colors cursor-pointer text-slate-400">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.14-.25.25-.51.25l.213-3.054 5.56-5.022c.24-.213-.054-.33-.373-.12l-6.87 4.326-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.458c.538-.196 1.006.128.832.941z"/></svg>
              </a>
            </div>
          </div>
        </div>
        <div className="flex flex-col md:flex-row justify-between items-center text-slate-500 text-sm border-t border-[#FAF9F6]/5 pt-8">
          <p>© 2026 Hasibul Game Point. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
