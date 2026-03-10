'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

const freightTypes = ['Dry Van', 'Refrigerated', 'Flatbed', 'Tanker', 'Intermodal', 'LTL', 'Hazmat'];

export default function CarrierSettingsPage() {
  const [notifications, setNotifications] = useState({
    emailApplications: true,
    emailMatches: true,
    smsUrgent: false,
    pushUpdates: true,
  });

  const [selectedFreight, setSelectedFreight] = useState<string[]>(['Dry Van', 'Refrigerated', 'Flatbed']);

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleFreight = (ft: string) => {
    setSelectedFreight((prev) =>
      prev.includes(ft) ? prev.filter((f) => f !== ft) : [...prev, ft]
    );
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-lmdr-dark">Carrier Settings</h2>

      {/* Company Info */}
      <Card elevation="md">
        <div className="flex items-center gap-2 mb-6">
          <span className="material-symbols-outlined text-xl text-lmdr-blue">business</span>
          <h3 className="text-lg font-semibold text-lmdr-dark">Company Information</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input id="companyName" label="Company Name" defaultValue="TransPro Logistics LLC" />
          <Input id="dot" label="DOT Number" defaultValue="3847291" />
          <Input id="mc" label="MC Number" defaultValue="MC-928471" />
          <Input id="phone" label="Phone" defaultValue="(555) 234-5678" />
          <div className="sm:col-span-2">
            <Input id="address" label="Address" defaultValue="4521 Industrial Blvd, Houston, TX 77001" />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button variant="primary" size="sm">Save Company Info</Button>
        </div>
      </Card>

      {/* Hiring Preferences */}
      <Card elevation="md">
        <div className="flex items-center gap-2 mb-6">
          <span className="material-symbols-outlined text-xl text-lmdr-blue">tune</span>
          <h3 className="text-lg font-semibold text-lmdr-dark">Hiring Preferences</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-lmdr-dark mb-1">CDL Class Required</label>
            <div className="flex gap-2">
              {['A', 'B', 'C'].map((cls) => (
                <Card
                  key={cls}
                  elevation="sm"
                  className="px-4 py-2 cursor-pointer text-center hover:bg-beige-d transition-colors"
                >
                  <span className="text-sm font-semibold text-lmdr-dark">CDL-{cls}</span>
                </Card>
              ))}
            </div>
          </div>
          <Input id="minExp" label="Minimum Experience (years)" type="number" defaultValue="2" />
        </div>

        <div>
          <label className="block text-sm font-medium text-lmdr-dark mb-2">Freight Types</label>
          <div className="flex flex-wrap gap-2">
            {freightTypes.map((ft) => (
              <button
                key={ft}
                onClick={() => toggleFreight(ft)}
                className="transition-all"
              >
                <Badge variant={selectedFreight.includes(ft) ? 'info' : 'default'}>
                  {ft}
                </Badge>
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button variant="primary" size="sm">Save Preferences</Button>
        </div>
      </Card>

      {/* Notification Settings */}
      <Card elevation="md">
        <div className="flex items-center gap-2 mb-6">
          <span className="material-symbols-outlined text-xl text-lmdr-blue">notifications</span>
          <h3 className="text-lg font-semibold text-lmdr-dark">Notification Settings</h3>
        </div>
        <div className="space-y-4">
          {[
            { key: 'emailApplications' as const, label: 'Email — New Applications', desc: 'Get notified when a driver applies to your jobs' },
            { key: 'emailMatches' as const, label: 'Email — AI Match Alerts', desc: 'Receive AI-powered match recommendations' },
            { key: 'smsUrgent' as const, label: 'SMS — Urgent Notifications', desc: 'Text messages for time-sensitive updates' },
            { key: 'pushUpdates' as const, label: 'Push — Dispatch Updates', desc: 'Browser notifications for dispatch status changes' },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-lmdr-dark">{item.label}</p>
                <p className="text-xs text-tan">{item.desc}</p>
              </div>
              <button
                onClick={() => toggleNotification(item.key)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  notifications[item.key] ? 'bg-lmdr-blue' : 'bg-tan/30'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                    notifications[item.key] ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
