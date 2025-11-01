
import React, { useEffect, useState } from 'react';
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


export const PwaFeaturesModal: React.FC<{ onClose: () => void; launchParams: any }> = ({ onClose, launchParams }) => {
    const [status, setStatus] = useState<Record<string, string>>({});
    const [fileContent, setFileContent] = useState('');

    const handleSubscribe = async () => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            setStatus(s => ({...s, push: 'الإشعارات غير مدعومة في هذا المتصفح.'}));
            return;
        }
        try {
            const registration = await navigator.serviceWorker.ready;
            const permission = await window.Notification.requestPermission();
            if (permission !== 'granted') {
                setStatus(s => ({...s, push: 'تم رفض إذن الإشعارات.'}));
                return;
            }
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
            });
            console.log('Push subscription:', JSON.stringify(subscription));
            setStatus(s => ({...s, push: 'تم الاشتراك بنجاح!'}));
        } catch (error) {
            console.error('Failed to subscribe to push notifications:', error);
            setStatus(s => ({...s, push: 'فشل الاشتراك.'}));
        }
    };

    const handleBgSync = async () => {
        if (!('serviceWorker' in navigator) || !('SyncManager' in window)) {
            setStatus(s => ({...s, sync: 'المزامنة بالخلفية غير مدعومة.'}));
            return;
        }
        try {
            const registration = await navigator.serviceWorker.ready;
            // FIX: Added @ts-ignore because 'sync' property is not on the default ServiceWorkerRegistration type.
            // @ts-ignore
            await registration.sync.register('add-review-sync');
            setStatus(s => ({...s, sync: 'تم تسجيل المزامنة. ستعمل عند توفر اتصال بالإنترنت.'}));
        } catch (error) {
            console.error('Failed to register background sync:', error);
            setStatus(s => ({...s, sync: 'فشل تسجيل المزامنة.'}));
        }
    };
    
    const handlePeriodicSync = async () => {
        // @ts-ignore
        if (!('serviceWorker' in navigator) || !('PeriodicSyncManager' in window)) {
            setStatus(s => ({...s, periodicSync: 'المزامنة الدورية غير مدعومة.'}));
            return;
        }
        try {
            const registration = await navigator.serviceWorker.ready;
            // @ts-ignore
            const status = await navigator.permissions.query({ name: 'periodic-background-sync' });
            if (status.state !== 'granted') {
                setStatus(s => ({...s, periodicSync: 'إذن المزامنة الدورية غير ممنوح.'}));
                return;
            }
            // @ts-ignore
            await registration.periodicSync.register('get-latest-artisans', { minInterval: 12 * 60 * 60 * 1000 }); // every 12 hours
            setStatus(s => ({...s, periodicSync: 'تم تسجيل المزامنة الدورية بنجاح.'}));

        } catch (error) {
            console.error('Failed to register periodic sync:', error);
            setStatus(s => ({...s, periodicSync: 'فشل تسجيل المزامنة الدورية.'}));
        }
    };

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
                        <h3 className="text-xl font-bold mb-3">الإشعارات والمزامنة</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <button onClick={handleSubscribe} className="w-full bg-navy text-ivory font-semibold py-2 px-4 rounded-lg hover:bg-navy/90 transition-colors">تفعيل الإشعارات</button>
                                {status.push && <p className="text-xs text-center text-slate mt-1">{status.push}</p>}
                            </div>
                            <div>
                                <button onClick={handleBgSync} className="w-full bg-navy text-ivory font-semibold py-2 px-4 rounded-lg hover:bg-navy/90 transition-colors">مزامنة بالخلفية</button>
                                {status.sync && <p className="text-xs text-center text-slate mt-1">{status.sync}</p>}
                            </div>
                             <div>
                                <button onClick={handlePeriodicSync} className="w-full bg-navy text-ivory font-semibold py-2 px-4 rounded-lg hover:bg-navy/90 transition-colors">مزامنة دورية</button>
                                {status.periodicSync && <p className="text-xs text-center text-slate mt-1">{status.periodicSync}</p>}
                            </div>
                        </div>
                         <p className="text-xs text-slate mt-4">ملاحظة: قد تحتاج إلى تفعيل هذه الميزات من خلال إعدادات المتصفح التجريبية (flags) وتثبيت التطبيق لتعمل بشكل صحيح.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
