import test, { before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { collection, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';

const projectId = 'demo-nanoware-ai';
let testEnv;

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId,
    firestore: { rules: await readFile(new URL('../firestore.rules', import.meta.url), 'utf8') },
  });
});

after(async () => {
  await testEnv?.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'admins', 'admin-user'), { active: true });
    await setDoc(doc(context.firestore(), 'admins', 'ordinary-user'), { active: false });
    await setDoc(doc(context.firestore(), 'projects', 'admin-project'), {
      userId: 'admin-user', name: 'Admin project', status: 'active', createdAt: new Date(),
    });
  });
});

test('signed-in users cannot get any admin marker or list admin markers', async () => {
  const userDb = testEnv.authenticatedContext('ordinary-user').firestore();

  await assertFails(getDoc(doc(userDb, 'admins', 'ordinary-user')));
  await assertFails(getDoc(doc(userDb, 'admins', 'admin-user')));
  await assertFails(getDocs(collection(userDb, 'admins')));
});

test('admin marker still grants intended project access through rules while direct marker reads stay denied', async () => {
  const adminDb = testEnv.authenticatedContext('admin-user').firestore();

  await assertFails(getDoc(doc(adminDb, 'admins', 'admin-user')));
  await assertSucceeds(getDoc(doc(adminDb, 'projects', 'admin-project')));
});

test('unmatched collections remain denied by default', async () => {
  const userDb = testEnv.authenticatedContext('ordinary-user').firestore();

  await assertFails(getDoc(doc(userDb, 'private-data', 'record')));
  await assertFails(getDocs(collection(userDb, 'private-data')));
});
