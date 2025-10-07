import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center px-6 shadow-sm">
      <div className="flex items-center space-x-4">
        <img
          src="/MBARI_logo_PMS534-2in.png"
          alt="MBARI Logo"
          className="h-10 w-auto"
        />
        <div className="flex flex-col">
          <h1 className="text-lg font-semibold text-gray-900">UAV Scope</h1>
          <p className="text-sm text-gray-600">MBARI UAV Project AI Visualization</p>
        </div>
      </div>
    </header>
  );
};

export default Header;
