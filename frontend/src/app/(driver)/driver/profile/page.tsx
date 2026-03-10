'use client';
import { useState } from 'react';
import { Card, Button, Input, Badge } from '@/components/ui';

export default function DriverProfilePage() {
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    cdlClass: 'A', cdlState: '', endorsements: '',
    yearsExperience: '', homeState: '', homeZip: '',
    preferredFreight: '', preferredRouteType: 'OTR',
  });

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setProfile(p => ({ ...p, [field]: e.target.value }));
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-lmdr-dark">My Profile</h2>
        <Button variant={editing ? 'primary' : 'secondary'} onClick={() => setEditing(!editing)}>
          {editing ? 'Save Changes' : 'Edit Profile'}
        </Button>
      </div>

      <Card>
        <h3 className="text-lg font-semibold text-lmdr-dark mb-4">Personal Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="First Name" value={profile.firstName} onChange={handleChange('firstName')} disabled={!editing} />
          <Input label="Last Name" value={profile.lastName} onChange={handleChange('lastName')} disabled={!editing} />
          <Input label="Email" type="email" value={profile.email} onChange={handleChange('email')} disabled={!editing} />
          <Input label="Phone" type="tel" value={profile.phone} onChange={handleChange('phone')} disabled={!editing} />
        </div>
      </Card>

      <Card>
        <h3 className="text-lg font-semibold text-lmdr-dark mb-4">CDL Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-lmdr-dark">CDL Class</label>
            <select
              value={profile.cdlClass}
              onChange={handleChange('cdlClass')}
              disabled={!editing}
              className="w-full rounded-lg px-4 py-2.5 text-sm bg-beige text-lmdr-dark shadow-[inset_4px_4px_8px_#C8B896,inset_-4px_-4px_8px_#FFFFF5]"
            >
              <option value="A">Class A</option>
              <option value="B">Class B</option>
            </select>
          </div>
          <Input label="CDL State" value={profile.cdlState} onChange={handleChange('cdlState')} disabled={!editing} placeholder="e.g. TX" />
          <Input label="Endorsements" value={profile.endorsements} onChange={handleChange('endorsements')} disabled={!editing} placeholder="e.g. H, T, N" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <Input label="Years of Experience" type="number" value={profile.yearsExperience} onChange={handleChange('yearsExperience')} disabled={!editing} />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-lmdr-dark">Route Preference</label>
            <select
              value={profile.preferredRouteType}
              onChange={handleChange('preferredRouteType')}
              disabled={!editing}
              className="w-full rounded-lg px-4 py-2.5 text-sm bg-beige text-lmdr-dark shadow-[inset_4px_4px_8px_#C8B896,inset_-4px_-4px_8px_#FFFFF5]"
            >
              <option value="OTR">OTR (Over the Road)</option>
              <option value="Regional">Regional</option>
              <option value="Local">Local</option>
              <option value="Dedicated">Dedicated</option>
            </select>
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="text-lg font-semibold text-lmdr-dark mb-4">Home Location</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Home State" value={profile.homeState} onChange={handleChange('homeState')} disabled={!editing} placeholder="e.g. TX" />
          <Input label="Home ZIP" value={profile.homeZip} onChange={handleChange('homeZip')} disabled={!editing} placeholder="e.g. 75001" />
        </div>
      </Card>
    </div>
  );
}
