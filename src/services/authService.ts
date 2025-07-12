import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, query, where, collection, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

export const checkUsernameAvailability = async (username: string): Promise<boolean> => {
  const q = query(collection(db, 'users'), where('username', '==', username.toLowerCase()));
  const querySnapshot = await getDocs(q);
  return querySnapshot.empty;
};

export const registerUser = async (email: string, password: string, username: string) => {
  const isAvailable = await checkUsernameAvailability(username);
  if (!isAvailable) {
    throw new Error('El nombre de usuario ya está en uso');
  }

  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  await setDoc(doc(db, 'users', user.uid), {
    uid: user.uid,
    email: email,
    username: username.toLowerCase(),
    displayName: username,
    createdAt: new Date()
  });

  return user;
};

export const loginUser = async (email: string, password: string) => {
  return await signInWithEmailAndPassword(auth, email, password);
};