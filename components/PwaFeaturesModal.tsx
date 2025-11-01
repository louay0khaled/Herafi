
import React, { useEffect, useState, useCallback } from 'react';
import { CloseIcon } from './icons';

// VAPID keys should be generated and stored securely. This is a dummy key for demonstration.
const VAPID_PUBLIC_KEY = 'BJV04y_n3x5v2sn2__wVf5A0YyQIXnBDaA-208362fQl_Mkae2wHY1nJED2F0nSoRDad5MhV-M3YgR-tN3eWPE';

// Function to convert VAPID public key string to a Uint8Array
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Reusable Toggle Switch Component
const ToggleSwitch: React.FC<{
  id: string;
  label: string;
  enabled: boolean;
  disabled?: boolean;
  onChange: (enabled: boolean) => void;
}> = ({ id, label, enabled, disabled = false, onChange }) => (
    <div className="flex items-center justify-between">
        <label id={`${id}-label`} className="text-lg font-semibold text-navy pr-4">{label}</label>
        <button
            id={id}
            role="switch"
            aria-checked={enabled}
            aria-labelledby={`${id}-label`}
            onClick={() => !disabled && onChange(!enabled)}
            disabled={disabled}
            className={`relative inline-flex items-center h-7 w-14 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold ${
            enabled ? 'bg-green-500' : 'bg-red-600'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
            <span
            className={`inline-block w-5 h-5 transform bg-white rounded-full transition-transform duration-300 ${
                enabled ? 'translate-x-8' : 'translate-x-1'
            }`}
            />
        </button>
    </div>
);

export const PwaFeaturesModal: React.FC<{ onClose: () => void; launchParams: any }> = ({ onClose, launchParams }) => {
    const [fileContent, setFileContent] = useState('');

    // --- Feature States ---
    const [isPushEnabled, setIsPushEnabled] = useState(false);
    const [isPushDisabled, setIsPushDisabled] = useState(false);
    const [pushStatus, setPushStatus] = useState('جاري التحقق...');

    const [isPeriodicSyncEnabled, setIsPeriodicSyncEnabled] = useState(false);
    const [isPeriodicSyncDisabled, setIsPeriodicSyncDisabled] = useState(false);
    const [periodicSyncStatus, setPeriodicSyncStatus] = useState('جاري التحقق...');

    const [bgSyncStatus, setBgSyncStatus] = useState('');

    // --- Permission and State Checking ---
    const checkFeatureStates = useCallback(async () => {
        if (!('serviceWorker' in navigator)) {
            setPushStatus('Service Worker غير مدعوم.');
            setPeriodicSyncStatus('Service Worker غير مدعوم.');
            setIsPushDisabled(true);
            setIsPeriodicSyncDisabled(true);
            return;
        }
        const registration = await navigator.serviceWorker.ready;

        // 1. Push Notifications
        if ('PushManager' in window && 'Notification' in window) {
            if (Notification.permission === 'denied') {
                setPushStatus('تم رفض الإذن بشكل دائم في المتصفح.');
                setIsPushDisabled(true);
                setIsPushEnabled(false);
            } else {
                const subscription = await registration.pushManager.getSubscription();
                if (subscription) {
                    setIsPushEnabled(true);
                    setPushStatus('الاشتراك مفعل.');
                } else {
                    setIsPushEnabled(false);
                    setPushStatus('يمكنك تفعيل الإشعارات.');
                }
            }
        } else {
            setPushStatus('الإشعارات غير مدعومة.');
            setIsPushDisabled(true);
        }

        // 2. Periodic Sync
        // @ts-ignore
        if ('periodicSync' in registration) {
            // @ts-ignore
            const permissionStatus = await navigator.permissions.query({ name: 'periodic-background-sync' });
            if (permissionStatus.state === 'denied') {
                setPeriodicSyncStatus('تم رفض الإذن بشكل دائم.');
                setIsPeriodicSyncDisabled(true);
                setIsPeriodicSyncEnabled(false);
            } else {
                // @ts-ignore
                const tags = await registration.periodicSync.getTags();
                const isRegistered = tags.includes('get-latest-artisans');
                setIsPeriodicSyncEnabled(isRegistered);
                setPeriodicSyncStatus(isRegistered ? 'المزامنة الدورية مفعلة.' : 'يمكنك تفعيل المزامنة الدورية.');
            }
        } else {
            setPeriodicSyncStatus('المزامنة الدورية غير مدعومة.');
            setIsPeriodicSyncDisabled(true);
        }
    }, []);

    useEffect(() => {
        checkFeatureStates();
    }, [checkFeatureStates]);

    // --- Toggle Handlers ---
    const handlePushToggle = async (enable: boolean) => {
        const registration = await navigator.serviceWorker.ready;
        if (enable) {
            try {
                const permission = await window.Notification.requestPermission();
                if (permission !== 'granted') {
                    setPushStatus('تم رفض إذن الإشعارات.');
                    return;
                }
                const subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
                });
                console.log('Push subscription:', JSON.stringify(subscription));
                setIsPushEnabled(true);
                setPushStatus('تم الاشتراك بنجاح!');
            } catch (error) {
                console.error('Failed to subscribe to push:', error);
                setPushStatus('فشل الاشتراك.');
            }
        } else {
            try {
                const subscription = await registration.pushManager.getSubscription();
                if (subscription) {
                    await subscription.unsubscribe();
                    setIsPushEnabled(false);
                    setPushStatus('تم إلغاء الاشتراك بنجاح.');
                }
            } catch (error) {
                console.error('Failed to unsubscribe from push:', error);
                setPushStatus('فشل إلغاء الاشتراك.');
            }
        }
    };

    const handlePeriodicSyncToggle = async (enable: boolean) => {
        const registration = await navigator.serviceWorker.ready;
        // @ts-ignore
        if (!('periodicSync' in registration)) return;
        
        if (enable) {
            try {
                 // @ts-ignore
                await registration.periodicSync.register('get-latest-artisans', { minInterval: 12 * 60 * 60 * 1000 });
                setIsPeriodicSyncEnabled(true);
                setPeriodicSyncStatus('تم تسجيل المزامنة الدورية بنجاح.');
            } catch (error) {
                console.error('Failed to register periodic sync:', error);
                setPeriodicSyncStatus('فشل تسجيل المزامنة الدورية.');
            }
        } else {
            try {
                 // @ts-ignore
                await registration.periodicSync.unregister('get-latest-artisans');
                setIsPeriodicSyncEnabled(false);
                setPeriodicSyncStatus('تم إلغاء تسجيل المزامنة الدورية.');
            } catch (error) {
                console.error('Failed to unregister periodic sync:', error);
                setPeriodicSyncStatus('فشل إلغاء تسجيل المزامنة.');
            }
        }
    };
    
    const handleBgSync = async () => {
        // @ts-ignore
        if (!('serviceWorker' in navigator) || !('SyncManager' in window)) {
            setBgSyncStatus('المزامنة بالخلفية غير مدعومة.');
            return;
        }
        try {
            const registration = await navigator.serviceWorker.ready;
            // @ts-ignore
            await registration.sync.register('add-review-sync');
            setBgSyncStatus('تم تسجيل طلب المزامنة. سيعمل عند توفر اتصال بالإنترنت.');
        } catch (error) {
            console.error('Failed to register background sync:', error);
            setBgSyncStatus('فشل تسجيل المزامنة.');
        }
    };

    // --- Launch Params Logic ---
    useEffect(() => {
      if (launchParams?.type === 'file') {
        const fileHandle = launchParams.files[0];
        if (fileHandle && fileHandle.getFile) {
          fileHandle.getFile().then((file: File) => {
            const reader = new FileReader();
            reader.onload = (e) => setFileContent(e.target?.result as string);
            reader.readAsText(file);
          });
        }
      }
    }, [launchParams]);

    const renderLaunchParams = () => {
      if (!launchParams) return <p className="text-slate">لم يتم تشغيل التطبيق عبر إجراء خاص.</p>;
      switch (launchParams.type) {
        case 'file':
          return (
            <div>
              <h4 className="font-bold">تم فتح ملف:</h4>
              <pre className="mt-2 p-2 bg-navy/10 rounded-md text-sm whitespace-pre-wrap max-h-40 overflow-auto">{fileContent || 'جاري قراءة الملف...'}</pre>
            </div>
          );
        case 'share':
          return (
            <div>
              <h4 className="font-bold">تمت المشاركة مع التطبيق:</h4>
              <p><b>العنوان:</b> {launchParams.title || 'لا يوجد'}</p>
              <p><b>النص:</b> {launchParams.text || 'لا يوجد'}</p>
            </div>
          );
        case 'protocol':
          return (
            <div>
              <h4 className="font-bold">تم التشغيل عبر بروتوكول:</h4>
              <p className="break-all"><code>web+artisan://{launchParams.url}</code></p>
            </div>
          );
        case 'note':
           return <div><h4 className="font-bold">تم التشغيل لتدوين ملاحظة جديدة.</h4></div>;
        default:
          return null;
      }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[70]" onClick={onClose}>
            <div className="bg-ivory text-navy rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 relative animate-fade-in" onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 left-4 text-slate hover:text-navy transition-colors"><CloseIcon className="h-8 w-8" /></button>
                <h2 className="text-3xl font-bold text-navy mb-6">ميزات التطبيق التقدمي (PWA)</h2>

                <div className="space-y-6">
                    <div className="p-4 bg-navy/5 rounded-lg">
                        <h3 className="text-xl font-bold mb-2">معلومات التشغيل</h3>
                        {renderLaunchParams()}
                    </div>

                    <div className="p-4 bg-navy/5 rounded-lg">
                        <h3 className="text-xl font-bold mb-4">الإعدادات التفاعلية</h3>
                        <div className="space-y-4">
                            <div>
                                <ToggleSwitch
                                    id="push-toggle"
                                    label="الإشعارات"
                                    enabled={isPushEnabled}
                                    disabled={isPushDisabled}
                                    onChange={handlePushToggle}
                                />
                                <p className="text-xs text-slate mt-1 pr-1">{pushStatus}</p>
                            </div>
                            <hr className="border-navy/10"/>
                            <div>
                                <ToggleSwitch
                                    id="periodic-sync-toggle"
                                    label="المزامنة الدورية"
                                    enabled={isPeriodicSyncEnabled}
                                    disabled={isPeriodicSyncDisabled}
                                    onChange={handlePeriodicSyncToggle}
                                />
                                <p className="text-xs text-slate mt-1 pr-1">{periodicSyncStatus}</p>
                            </div>
                             <hr className="border-navy/10"/>
                             <div>
                                <div className="flex items-center justify-between">
                                     <label className="text-lg font-semibold text-navy pr-4">المزامنة بالخلفية</label>
                                     <button onClick={handleBgSync} className="bg-navy text-ivory font-semibold py-2 px-5 rounded-lg hover:bg-navy/90 transition-colors text-sm">
                                        طلب مزامنة
                                     </button>
                                </div>
                                <p className="text-xs text-slate mt-1 pr-1">{bgSyncStatus || 'طلب مزامنة يدوية عند الحاجة.'}</p>
                            </div>
                        </div>
                         <p className="text-xs text-slate mt-4">ملاحظة: قد تحتاج إلى تفعيل هذه الميزات من خلال إعدادات المتصفح التجريبية (flags) وتثبيت التطبيق لتعمل بشكل صحيح.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
