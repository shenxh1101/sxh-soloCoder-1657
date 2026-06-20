import { Bell, Search, User, Settings } from 'lucide-react';

interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="搜索..."
            className="w-64 h-9 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
          />
        </div>

        <button className="relative w-9 h-9 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors">
          <Bell className="w-5 h-5 text-gray-600" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-warning-500 rounded-full"></span>
        </button>

        <button className="w-9 h-9 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors">
          <Settings className="w-5 h-5 text-gray-600" />
        </button>

        <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-gray-700">管理员</p>
            <p className="text-xs text-gray-500">门店管理员</p>
          </div>
        </div>
      </div>
    </header>
  );
}
