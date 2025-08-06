import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";

export const signUp = (email: string, password: string) => {
  const auth = getAuth();
  createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      // Signed up 
      const user = userCredential.user;
      // ...
      return user
    })
    .catch((error) => {
      return error
      // const errorCode = error.code;
      // const errorMessage = error.message;
      // ..
    });
}

export const signIn = (email: string, password: string, callback: () => void) => {
  const auth = getAuth();
  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      // Signed in 
      const user = userCredential.user;
      callback()
    })
    .catch((error) => {
      return error;
    });
}

