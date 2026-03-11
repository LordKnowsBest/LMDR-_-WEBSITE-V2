'use server';

import { driverFetch } from '@/lib/driver-api';

export async function getHealthResources(category?: string) {
  const params = category ? `?category=${category}` : '';
  return driverFetch<unknown[]>(`/wellness/health${params}`);
}

export async function getHealthResource(id: string) {
  return driverFetch<unknown>(`/wellness/health/${id}`);
}

export async function getHealthTips() {
  return driverFetch<unknown[]>('/wellness/health/tips');
}

export async function submitHealthTip(data: { driverId: string; category: string; title: string; content: string }) {
  return driverFetch<unknown>('/wellness/health/tips', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function searchPetFriendly(lat: number, lng: number, radiusMiles = 50) {
  return driverFetch<unknown[]>(`/wellness/pets/nearby?lat=${lat}&lng=${lng}&radiusMiles=${radiusMiles}`);
}

export async function getPetFriendlyLocation(id: string) {
  return driverFetch<unknown>(`/wellness/pets/${id}`);
}

export async function submitPetFriendlyLocation(data: { name: string; lat: number; lng: number; address: string; amenities?: string[]; driverId: string }) {
  return driverFetch<unknown>('/wellness/pets', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function reviewPetFriendlyLocation(id: string, data: { driverId: string; rating: number; comment?: string; hasDogPark?: boolean; hasPetArea?: boolean }) {
  return driverFetch<unknown>(`/wellness/pets/${id}/review`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getMentors() {
  return driverFetch<unknown[]>('/wellness/mentors');
}

export async function requestMentor(data: { driverId: string; mentorId: string; goals?: string }) {
  return driverFetch<unknown>('/wellness/mentors/request', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
