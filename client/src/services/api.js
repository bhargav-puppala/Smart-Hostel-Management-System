import { DEMO_MODE } from '../config/flags';
import * as demoApiModule from './demoApi';
import * as firebaseApiModule from './firebaseApi';

const selectedApi = DEMO_MODE ? demoApiModule : firebaseApiModule;

export const isDemoMode = DEMO_MODE;

export const getImageUrl = selectedApi.getImageUrl;

export const authApi = selectedApi.authApi;
export const hostelsApi = selectedApi.hostelsApi;
export const roomsApi = selectedApi.roomsApi;
export const usersApi = selectedApi.usersApi;
export const feesApi = selectedApi.feesApi;
export const complaintsApi = selectedApi.complaintsApi;
export const statsApi = selectedApi.statsApi;
export const announcementsApi = selectedApi.announcementsApi;
export const allotmentsApi = selectedApi.allotmentsApi;
export const bookingsApi = selectedApi.bookingsApi;
export const paymentsApi = selectedApi.paymentsApi;
export const leavesApi = selectedApi.leavesApi;
export const visitorsApi = selectedApi.visitorsApi;
export const uploadApi = selectedApi.uploadApi;

export const signOutApiSession = selectedApi.signOutApiSession;
export const switchDemoRoleSession = selectedApi.switchDemoRoleSession || (() => {});

const api = {
  isDemoMode,
  authApi,
  hostelsApi,
  roomsApi,
  usersApi,
  feesApi,
  complaintsApi,
  statsApi,
  announcementsApi,
  allotmentsApi,
  bookingsApi,
  paymentsApi,
  leavesApi,
  visitorsApi,
  uploadApi,
};

export default api;
