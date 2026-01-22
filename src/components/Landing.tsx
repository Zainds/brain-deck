import React from 'react';
import { Brain, Sparkles, Zap, Shield, ChevronRight } from 'lucide-react';

interface LandingProps {
  onLogin: () => void;
}

export const Landing = ({ onLogin }: LandingProps) => {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">BrainDeck</span>
            </div>
            <button
              onClick={onLogin}
              className="bg-white text-blue-600 border border-blue-200 px-6 py-2 rounded-full font-medium hover:bg-blue-50 transition-colors"
            >
              Войти
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden pt-12 pb-8" /* pt 16 pb 8 */> 
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-slate-100 -z-10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-700 font-medium mb-8">
            <Sparkles className="w-4 h-4" />
            <span>Новый способ обучения</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-8 tracking-tight leading-tight">
            Запоминайте <span className="text-blue-600">навсегда</span><br />
            без лишних усилий
          </h1>
          
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
            BrainDeck использует алгоритм интервального повторения SuperMemo2, чтобы помочь вам выучить любой материал в кратчайшие сроки.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={onLogin}
              className="group bg-blue-600 text-white px-8 py-4 rounded-full text-lg font-bold hover:bg-blue-700 transition-all hover:scale-105 shadow-xl shadow-blue-600/20 flex items-center justify-center gap-2"
            >
              Начать бесплатно
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6" /* py-24 */>
        <div className="grid md:grid-cols-3 gap-12">
          <FeatureCard 
            icon={<Brain className="w-8 h-8 text-blue-600" />}
            title="Умный алгоритм"
            description="Наша система подстраивается под ваш темп обучения, показывая карточки именно тогда, когда вы начинаете их забывать."
          />
          <FeatureCard 
            icon={<Zap className="w-8 h-8 text-orange-500" />}
            title="Мгновенный результат"
            description="Тратьте меньше времени на учебу и получайте лучшие оценки. Эффективность доказана научными исследованиями."
          />
          <FeatureCard 
            icon={<Shield className="w-8 h-8 text-green-600" />}
            title="Ваши знания в безопасности"
            description="Автоматическая синхронизация и резервное копирование гарантируют сохранность ваших учебных материалов."
          />
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 text-gray-900 font-bold">
            <Brain className="w-5 h-5 text-blue-600" />
            BrainDeck
          </div>
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} BrainDeck. Все права защищены.
          </p>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
  <div className="bg-white p-8 rounded-3xl shadow-lg shadow-gray-100/50 hover:shadow-xl hover:shadow-gray-200/50 transition-all border border-gray-100">
    <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-6">
      {icon}
    </div>
    <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
    <p className="text-gray-600 leading-relaxed">{description}</p>
  </div>
);
