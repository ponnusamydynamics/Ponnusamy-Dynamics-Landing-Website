import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Project, ItemCategory } from '../types';

const PROJECTS_COLLECTION = 'projects';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function normalizeCategory(raw: string | undefined): ItemCategory {
  if (!raw) return 'launch';
  const val = raw.toLowerCase().trim();
  if (val === 'collaboration' || val === 'collaborations' || val === 'client' || val === 'clients') {
    return 'collaboration';
  }
  if (val === 'doc' || val === 'docs' || val === 'research' || val === 'paper') {
    return 'doc';
  }
  return 'launch';
}

export function normalizeStatus(raw: string | undefined): 'Projected' | 'In Dev' | 'Beta' | 'Published' {
  if (!raw) return 'In Dev';
  const val = raw.trim();
  if (val === 'Projected' || val === 'In Dev' || val === 'Beta' || val === 'Published') {
    return val;
  }
  // Handle legacy values
  const upper = val.toUpperCase();
  if (upper === 'ACTIVE') return 'In Dev';
  if (upper === 'BETA') return 'Beta';
  if (upper === 'STABLE') return 'Published';
  if (upper === 'EXPERIMENTAL') return 'Projected';
  if (upper === 'ARCHIVED') return 'Published';
  return 'In Dev';
}

function parseProjectDoc(docSnap: any): Project {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    category: normalizeCategory(data.category),
    projectId: data.projectId || docSnap.id,
    title: data.title || 'Untitled Entry',
    status: normalizeStatus(data.status),
    shortDesc: data.shortDesc || '',
    readme: data.readme || '',
    clientName: data.clientName || '',
    clientRole: data.clientRole || '',
    clientPeriod: data.clientPeriod || '',
    docType: data.docType || '',
    docReadingTime: data.docReadingTime || '',
    docDate: data.docDate || '',
    docContext: data.docContext || '',
    externalUrl: data.externalUrl || '',
    githubUrl: data.githubUrl || '',
    liveUrl: data.liveUrl || '',
    tags: Array.isArray(data.tags) ? data.tags : [],
    order: typeof data.order === 'number' ? data.order : 0,
    published: data.published !== false,
    isRestricted: Boolean(data.isRestricted ?? data.restricted ?? false),
    isClassified: Boolean(data.isClassified ?? data.classified ?? false),
    authorEmail: data.authorEmail || '',
    icon: data.icon && typeof data.icon === 'object' && data.icon.data ? data.icon : undefined,
    createdAt: data.createdAt ? String(data.createdAt) : undefined,
    updatedAt: data.updatedAt ? String(data.updatedAt) : undefined,
  };
}

export function subscribeProjects(
  onUpdate: (projects: Project[]) => void,
  onError?: (err: Error) => void
) {
  const colRef = collection(db, PROJECTS_COLLECTION);
  const q = query(colRef, orderBy('order', 'asc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: Project[] = [];
      snapshot.forEach((docSnap) => {
        items.push(parseProjectDoc(docSnap));
      });
      onUpdate(items);
    },
    (err) => {
      try {
        handleFirestoreError(err, OperationType.LIST, PROJECTS_COLLECTION);
      } catch (formattedErr: any) {
        if (onError) onError(formattedErr);
      }
    }
  );
}

export async function fetchProjectsOnce(): Promise<Project[]> {
  try {
    const colRef = collection(db, PROJECTS_COLLECTION);
    const q = query(colRef, orderBy('order', 'asc'));
    const snapshot = await getDocs(q);
    const items: Project[] = [];
    snapshot.forEach((docSnap) => {
      items.push(parseProjectDoc(docSnap));
    });
    return items;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, PROJECTS_COLLECTION);
  }
}

export async function saveProject(project: Partial<Project>, authorEmail: string): Promise<string> {
  const now = new Date().toISOString();
  const category = normalizeCategory(project.category);
  const defaultPrefix = category === 'collaboration' ? 'CLB' : (category === 'doc' ? 'DOC' : 'LNCH');
  
  const id = project.id || (
    project.projectId
      ? project.projectId.toLowerCase().replace(/[^a-z0-9_-]/g, '-')
      : `${defaultPrefix.toLowerCase()}-${Date.now()}`
  );

  const docRef = doc(db, PROJECTS_COLLECTION, id);

  const payload: Record<string, any> = {
    category,
    projectId: project.projectId || `${defaultPrefix}-01`,
    title: project.title || 'Untitled Entry',
    status: normalizeStatus(project.status),
    shortDesc: project.shortDesc || '',
    readme: project.readme || '',
    clientName: project.clientName || '',
    clientRole: project.clientRole || '',
    clientPeriod: project.clientPeriod || '',
    docType: project.docType || '',
    docReadingTime: project.docReadingTime || '',
    docDate: project.docDate || '',
    docContext: project.docContext || '',
    externalUrl: project.externalUrl || '',
    githubUrl: project.githubUrl || '',
    liveUrl: project.liveUrl || '',
    tags: project.tags || [],
    order: typeof project.order === 'number' ? project.order : 0,
    published: project.published !== false,
    isRestricted: Boolean(project.isRestricted ?? project.restricted ?? false),
    isClassified: Boolean(project.isClassified ?? project.classified ?? false),
    authorEmail: project.authorEmail || authorEmail,
    updatedAt: now,
    ...(project.id ? {} : { createdAt: now }),
    _serverTimestamp: serverTimestamp(),
  };

  if (project.icon && project.icon.data) {
    payload.icon = {
      data: project.icon.data,
      shape: project.icon.shape || 'squircle',
      size: project.icon.size || 'md',
      fit: project.icon.fit || 'cover',
    };
  } else if (project.icon === null) {
    payload.icon = null;
  }

  try {
    await setDoc(docRef, payload, { merge: true });
    return id;
  } catch (err) {
    handleFirestoreError(err, project.id ? OperationType.UPDATE : OperationType.CREATE, `${PROJECTS_COLLECTION}/${id}`);
  }
}

export async function deleteProject(id: string): Promise<void> {
  const docRef = doc(db, PROJECTS_COLLECTION, id);
  try {
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${PROJECTS_COLLECTION}/${id}`);
  }
}
