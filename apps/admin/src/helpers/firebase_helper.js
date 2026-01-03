import { initializeApp } from "firebase/app";
import {
  FacebookAuthProvider,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import {
  collection,
  doc,
  getFirestore,
  getDocs,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getAnalytics, isSupported as isAnalyticsSupported } from "firebase/analytics";
import {
  getDownloadURL,
  getStorage,
  ref,
  uploadBytes,
} from "firebase/storage";

class FirebaseAuthBackend {
  constructor(firebaseConfig) {
    if (firebaseConfig) {
      this.app = initializeApp(firebaseConfig);
      this.auth = getAuth(this.app);
      this.db = getFirestore(this.app);
      this.storage = getStorage(this.app);

      isAnalyticsSupported()
        .then((supported) => {
          if (supported) {
            this.analytics = getAnalytics(this.app);
          }
        })
        .catch(() => {
          // ignore analytics errors
        });

      onAuthStateChanged(this.auth, (user) => {
        if (user) {
          localStorage.setItem("authUser", JSON.stringify(user));
        } else {
          localStorage.removeItem("authUser");
        }
      });
    }
  }

  /**
   * Registers the user with given details
   */
  registerUser = (email, password) => {
    return new Promise((resolve, reject) => {
      createUserWithEmailAndPassword(this.auth, email, password).then(
        () => {
          resolve(this.auth.currentUser);
        },
        (error) => {
          reject(this._handleError(error));
        }
      );
    });
  };

  /**
   * Registers the user with given details
   */
  editProfileAPI = (email, password) => {
    return new Promise((resolve, reject) => {
      createUserWithEmailAndPassword(this.auth, email, password).then(
        () => {
          resolve(this.auth.currentUser);
        },
        (error) => {
          reject(this._handleError(error));
        }
      );
    });
  };

  /**
   * Login user with given details
   */
  loginUser = (email, password) => {
    return new Promise((resolve, reject) => {
      signInWithEmailAndPassword(this.auth, email, password).then(
        () => {
          resolve(this.auth.currentUser);
        },
        (error) => {
          reject(this._handleError(error));
        }
      );
    });
  };

  /**
   * forget Password user with given details
   */
  forgetPassword = email => {
    return new Promise((resolve, reject) => {
      sendPasswordResetEmail(this.auth, email, {
        url: window.location.protocol + "//" + window.location.host + "/login",
      })
        .then(() => {
          resolve(true);
        })
        .catch((error) => {
          reject(this._handleError(error));
        });
    });
  };

  /**
   * Logout the user
   */
  logout = () => {
    return new Promise((resolve, reject) => {
      signOut(this.auth)
        .then(() => {
          resolve(true);
        })
        .catch((error) => {
          reject(this._handleError(error));
        });
    });
  };

  /**
  * Social Login user with given details
  */

  socialLoginUser = async (type) => {
    let provider;
    if (type === "google") {
        provider = new GoogleAuthProvider();
    } else if (type === "facebook") {
        provider = new FacebookAuthProvider();
    }
    try {
        const result = await signInWithPopup(this.auth, provider);
        return result.user;
    } catch (error) {
        throw this._handleError(error);
    }
};

  addNewUserToFirestore = (user) => {
    const { profile } = user.additionalUserInfo;
    const details = {
      firstName: profile.given_name ? profile.given_name : profile.first_name,
      lastName: profile.family_name ? profile.family_name : profile.last_name,
      fullName: profile.name,
      email: profile.email,
      picture: profile.picture,
      createdDtm: serverTimestamp(),
      lastLoginTime: serverTimestamp()
    };
    setDoc(doc(this.db, "users", this.auth.currentUser.uid), details, { merge: true });
    return { user, details };
  };

  uploadFile = async ({ path, file, contentType }) => {
    const storageRef = ref(this.storage, path);
    const metadata = contentType ? { contentType } : undefined;
    const snapshot = await uploadBytes(storageRef, file, metadata);
    const url = await getDownloadURL(snapshot.ref);
    return { url, path: snapshot.metadata.fullPath };
  };

  createUserWithDetails = async ({
    email,
    password,
    firstName,
    lastName,
    gender,
    birthDate,
    phone,
    role,
    status,
    address,
    photoFile,
  }) => {
    const userCredential = await createUserWithEmailAndPassword(
      this.auth,
      email,
      password
    );

    const uid = userCredential.user.uid;

    let photo = null;
    if (photoFile) {
      const extension = photoFile?.name?.split(".").pop() || "jpg";
      const upload = await this.uploadFile({
        path: `users/${uid}/photo.${extension}`,
        file: photoFile,
        contentType: photoFile.type,
      });
      photo = upload;
    }

    const docData = {
      uid,
      firstName: firstName || "",
      lastName: lastName || "",
      gender: gender || "",
      birthDate: birthDate || "",
      email: email || "",
      phone: phone || "",
      role: role || "",
      status: status || "active",
      address: {
        cep: address?.cep || "",
        estado: address?.estado || "",
        cidade: address?.cidade || "",
        bairro: address?.bairro || "",
        numero: address?.numero || "",
      },
      photoUrl: photo?.url || "",
      photoPath: photo?.path || "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(doc(this.db, "users", uid), docData, { merge: true });
    return { authUser: userCredential.user, userDoc: docData };
  };

  listUsers = async () => {
    const snap = await getDocs(collection(this.db, "users"));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  };

  setLoggeedInUser = user => {
    localStorage.setItem("authUser", JSON.stringify(user));
  };

  /**
   * Returns the authenticated user
   */
  getAuthenticatedUser = () => {
    if (!localStorage.getItem("authUser")) return null;
    return JSON.parse(localStorage.getItem("authUser"));
  };

  /**
   * Handle the error
   * @param {*} error
   */
  _handleError(error) {
    // var errorCode = error.code;
    var errorMessage = error.message;
    return errorMessage;
  }
}

let _fireBaseBackend = null;

/**
 * Initilize the backend
 * @param {*} config
 */
const initFirebaseBackend = config => {
  if (!_fireBaseBackend) {
    _fireBaseBackend = new FirebaseAuthBackend(config);
  }
  return _fireBaseBackend;
};

/**
 * Returns the firebase backend
 */
const getFirebaseBackend = () => {
  return _fireBaseBackend;
};

const getFirebaseServices = () => {
  if (!_fireBaseBackend) return null;
  return {
    app: _fireBaseBackend.app,
    auth: _fireBaseBackend.auth,
    db: _fireBaseBackend.db,
    storage: _fireBaseBackend.storage,
    analytics: _fireBaseBackend.analytics,
  };
};

export { initFirebaseBackend, getFirebaseBackend, getFirebaseServices };
