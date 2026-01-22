import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css';
import { Dashboard } from '../shared/components/Dashboard';
import { MOCK_USER_PROFILE, MOCK_REPORTS_DATA } from '../shared/services/mockData';

const DashboardApp = () => {
  const [privacyLevel, setPrivacyLevel] = useState<any>('balanced');
  
  return (
    <div className="bg-black min-h-screen">
       <Dashboard 
          profile={MOCK_USER_PROFILE}
          reportsData={MOCK_REPORTS_DATA}
          privacyLevel={privacyLevel}
          setPrivacyLevel={setPrivacyLevel}
          isProtectionOn={true}
          onClearData={() => console.log('Clear Data')}
          onClose={() => window.close()}
          activeTab={'home'}
          onTabChange={(tab) => console.log('Tab:', tab)}
          showToast={(msg) => console.log(msg)}
          onOpenEntity={() => {}}
          onOpenPersona={() => {}}
          onTriggerIntervention={() => {}}

          onStartTutorial={() => console.log("Start Tutorial")} 
          onTriggerStrictBlock={() => console.log("Trigger Block")}
       />
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<React.StrictMode><DashboardApp /></React.StrictMode>);