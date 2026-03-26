import { GoogleAuthProvider, getAuth, signInWithPopup } from "firebase/auth";
import { app } from "../firebase";
import { useDispatch } from "react-redux";
import { signInSuccess } from "../redux/user/userSlice";
import { useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";

export default function OAuth() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleGoogleClick = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const auth = getAuth(app);
      const result = await signInWithPopup(auth, provider);

      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: result.user.displayName,
          email: result.user.email,
          photo: result.user.photoURL,
        }),
      });
      const data = await res.json();
      dispatch(signInSuccess(data));
      navigate("/");
    } catch (error) {
      console.log("Could not sign in with Google", error);
    }
  };
  return (
    <button
      type="button"
      onClick={handleGoogleClick}
      className="flex items-center justify-between border-2 border-slate-300 rounded-full overflow-hidden h-14 w-full shadow-md hover:shadow-lg transition-all duration-300 active:scale-95"
    >
      <div className="bg-white border-r-2 border-slate-300 h-full w-1/4 flex justify-center items-center">
        <FcGoogle size={28} />
      </div>
      <div className="bg-slate-700 h-full w-3/4 flex justify-center items-center px-4">
        <span className="text-white font-medium text-lg ">
          Continue with Google
        </span>
      </div>
    </button>
  );
}
