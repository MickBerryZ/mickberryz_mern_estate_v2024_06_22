import { useEffect, useState } from "react";
import {
  getDownloadURL,
  getStorage,
  ref,
  uploadBytesResumable,
} from "firebase/storage";
import { app } from "../firebase";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import Map from "../components/Map";

export default function CreateListing() {
  const { currentUser } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const params = useParams();
  const [files, setFiles] = useState([]);
  const [formData, setFormData] = useState({
    imageUrls: [],
    name: "",
    description: "",
    address: "",
    type: "rent",
    bedrooms: 1,
    bathrooms: 1,
    regularPrice: 50,
    discountPrice: 0,
    offer: false,
    parking: false,
    furnished: false,
  });
  const [imageUploadError, setImageUploadError] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  // Map & Address States
  const [addressVerified, setAddressVerified] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [mapAddress, setMapAddress] = useState("");

  useEffect(() => {
    const fetchListing = async () => {
      const listingId = params.listingId;
      const res = await fetch(`/api/listing/get/${listingId}`);
      const data = await res.json();
      if (data.success === false) {
        console.log(data.message);
        return;
      }
      setFormData(data);
      setMapAddress(data.address);
    };
    fetchListing();
  }, [params.listingId]);

  const handleImageSubmit = (e) => {
    if (files.length > 0 && files.length + formData.imageUrls.length < 7) {
      setUploading(true);
      setImageUploadError(false);
      const promises = [];

      for (let i = 0; i < files.length; i++) {
        promises.push(storeImage(files[i]));
      }
      Promise.all(promises)
        .then((urls) => {
          setFormData({
            ...formData,
            imageUrls: formData.imageUrls.concat(urls),
          });
          setImageUploadError(false);
          setUploading(false);
        })
        .catch((err) => {
          setImageUploadError("Image upload failed (10 MB max per image)");
          setUploading(false);
        });
    } else {
      setImageUploadError("You can only upload 6 images per listing");
      setUploading(false);
    }
  };

  const storeImage = async (file) => {
    return new Promise((resolve, reject) => {
      const storage = getStorage(app);
      const fileName = new Date().getTime() + file.name;
      const storageRef = ref(storage, fileName);
      const uploadTask = uploadBytesResumable(storageRef, file);
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(`Upload is ${progress}% done`);
        },
        (error) => {
          reject(error);
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
            resolve(downloadURL);
          });
        },
      );
    });
  };

  const handleRemoveImage = (index) => {
    setFormData({
      ...formData,
      imageUrls: formData.imageUrls.filter((_, i) => i !== index),
    });
  };

  const handleChange = (e) => {
    if (e.target.id === "sale" || e.target.id === "rent") {
      setFormData({ ...formData, type: e.target.id });
    }
    if (["parking", "furnished", "offer"].includes(e.target.id)) {
      setFormData({ ...formData, [e.target.id]: e.target.checked });
    }

    if (["number", "text", "textarea"].includes(e.target.type)) {
      setFormData({ ...formData, [e.target.id]: e.target.value });
    }
  };

  // The Address Search Logic
  const handleAddressSearch = async (e) => {
    const value = e.target.value;
    setFormData({ ...formData, address: value });
    setAddressVerified(false); // They changed the text, so it's unverified again

    if (value.length > 3) {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${value}&limit=5`,
        { headers: { "User-Agent": "MickBerryz_App" } },
      );
      const data = await res.json();
      setSuggestions(data);
    } else {
      setSuggestions([]);
    }
  };

  // The Verify Button Logic
  const handleVerifyAddress = async () => {
    if (!formData.address) return alert("Please enter an address first!");
    try {
      setVerifying(true);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(formData.address)}`,
        { headers: { "User-Agent": "MickBerryz_App" } },
      );
      const data = await response.json();
      if (data && data.length > 0) {
        setAddressVerified(true);
        setMapAddress(formData.address); // Move the map!
        alert("Location found! Your map pin is ready.");
      } else {
        setAddressVerified(false);
        alert("Address not found on map. Try being more specific.");
      }
      setVerifying(false);
    } catch (error) {
      setVerifying(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (formData.imageUrls.length < 1)
        return setError("You must upload at least one image");
      if (formData.regularPrice < +formData.discountPrice)
        return setError("Discount price must be lover");
      if (!addressVerified)
        return setError("Please verify the address on the map first!");

      setLoading(true);
      setError(false);
      const res = await fetch(`/api/listing/update/${params.listingId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          userRef: currentUser._id,
        }),
      });
      const data = await res.json();
      setLoading(false);
      if (data.success === false) {
        setError(data.message);
        return;
      }
      navigate(`/listing/${data._id}`);
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <main className="p-3 max-w-4xl mx-auto">
      <h1 className="text-3xl font-semibold text-center my-7">
        Update a Listings
      </h1>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
        {/* --- LEFT COLUMN --- */}
        <div className="flex flex-col gap-4 flex-1">
          <input
            type="text"
            placeholder="Name"
            className="border p-3 rounded-lg"
            id="name"
            maxLength="62"
            minLength="10"
            required
            onChange={handleChange}
            value={formData.name}
          />
          <textarea
            type="text"
            placeholder="Description"
            className="border p-3 rounded-lg"
            id="description"
            required
            onChange={handleChange}
            value={formData.description}
          />

          <div className="flex gap-6 flex-wrap">
            <div className="flex gap-2">
              <input
                type="checkbox"
                id="sale"
                className="w-5"
                onChange={handleChange}
                checked={formData.type === "sale"}
              />
              <span>Sell</span>
            </div>
            <div className="flex gap-2">
              <input
                type="checkbox"
                id="rent"
                className="w-5"
                onChange={handleChange}
                checked={formData.type === "rent"}
              />
              <span>Rent</span>
            </div>
            <div className="flex gap-2">
              <input
                type="checkbox"
                id="parking"
                className="w-5"
                onChange={handleChange}
                checked={formData.parking}
              />
              <span>Parking Spot</span>
            </div>
            <div className="flex gap-2">
              <input
                type="checkbox"
                id="furnished"
                className="w-5"
                onChange={handleChange}
                checked={formData.furnished}
              />
              <span>Furnished</span>
            </div>
            <div className="flex gap-2">
              <input
                type="checkbox"
                id="offer"
                className="w-5"
                onChange={handleChange}
                checked={formData.offer}
              />
              <span>Offer</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <input
                type="number"
                id="bedrooms"
                min="1"
                max="10"
                required
                className="p-3 border border-gray-600 rounded-lg"
                onChange={handleChange}
                value={formData.bedrooms}
              />
              <p>Beds</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                id="bathrooms"
                min="1"
                max="10"
                required
                className="p-3 border border-gray-600 rounded-lg"
                onChange={handleChange}
                value={formData.bathrooms}
              />
              <p>Baths</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                id="regularPrice"
                min="1"
                max="10000000000"
                required
                className="p-3 border border-gray-600 rounded-lg"
                onChange={handleChange}
                value={formData.regularPrice}
              />
              <div className="flex flex-col items-center">
                <p>Regular price</p>
                {formData.type === "rent" && (
                  <span className="text-xs">($ / month)</span>
                )}
              </div>
            </div>
            {formData.offer && (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  id="discountPrice"
                  min="0"
                  max="10000000000"
                  required
                  className="p-3 border border-gray-600 rounded-lg"
                  onChange={handleChange}
                  value={formData.discountPrice}
                />

                <div className="flex flex-col items-center">
                  <p>Discounted price</p>
                  {formData.type === "rent" && (
                    <span className="text-xs">($ / month)</span>
                  )}
                </div>
              </div>
            )}
          </div>
          {/* 📍 ADDRESS & MAP SECTION */}
          <div className="relative flex flex-col gap-2">
            <input
              type="text"
              placeholder="Address"
              className="border p-3 rounded-lg"
              id="address"
              required
              onChange={handleChange}
              value={formData.address}
            />

            {/* Suggestion Dropdown */}
            {suggestions.length > 0 && (
              <ul className="absolute top-[52px] left-0 z-50 bg-white border w-full rounded-md shadow-2xl max-h-48 overflow-y-auto">
                {suggestions.map((place) => (
                  <li
                    key={place.place_id}
                    className="p-3 hover:bg-indigo-100 cursor-pointer text-sm border-b"
                    onClick={() => {
                      setFormData({ ...formData, address: place.display_name });
                      setMapAddress(place.display_name); // Move Map!
                      setAddressVerified(true);
                      setSuggestions([]);
                    }}
                  >
                    {place.display_name}
                  </li>
                ))}
              </ul>
            )}

            <button
              type="button"
              onClick={handleVerifyAddress}
              className="text-indigo-700 border border-indigo-700 p-2 rounded-lg uppercase hover:bg-indigo-50 font-semibold text-sm transition-all"
            >
              {verifying ? "Checking..." : "Verify Address on Map"}
            </button>
            {addressVerified && (
              <p className="text-green-700 text-xs font-bold animate-pulse">
                ✓ Location verified
              </p>
            )}

            {/* 🗺️ THE MAP PREVIEW */}
            {mapAddress && (
              <div className="mt-2 border-t pt-4">
                <p className="font-semibold mb-2 text-indigo-700 flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full animate-ping"></span>
                  Location Preview:
                </p>
                <Map key={mapAddress} address={mapAddress} />
                {!addressVerified && formData.address && (
                  <p className="text-amber-600 text-[10px] mt-2 italic font-medium">
                    ⚠️ Map previewing original address. Click "Verify" to lock
                    in changes.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col flex-1 gap-4">
          <p className="font-semibold">
            Images:
            <span className="font-normal text-gray-600 ml-2">
              The first image will be the cover (max 6)
            </span>
          </p>
          <div className="flex gap-4">
            <input
              onChange={(e) => setFiles(e.target.files)}
              className="p-3 border border-gray-300 rounded w-full"
              type="file"
              id="images"
              accept="image/*"
              multiple
            />
            <button
              type="button"
              disabled={uploading}
              onClick={handleImageSubmit}
              className="p-3 text-green-700 border border-green-700 rounded uppercase hover:shadow-lg disabled:opacity-80"
            >
              {uploading ? "Uploading" : "Upload"}
            </button>
          </div>
          <p className="text-red-700 text-sm">
            {imageUploadError && imageUploadError}
          </p>
          {formData.imageUrls.length > 0 &&
            formData.imageUrls.map((url, index) => (
              <div
                key={url}
                className="flex justify-between p-3 border items-center"
              >
                <img
                  src={url}
                  alt="listing image"
                  className="w-20 h-20 object-contain rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="p-3 text-red-700 rounded-lg uppercase hover:opacity-30"
                >
                  Delete
                </button>
              </div>
            ))}

          <button
            disabled={loading || uploading}
            className="p-3 bg-indigo-700 text-white rounded-lg uppercase hover:opacity-95 disabled:opacity-10"
          >
            {loading ? "Updating..." : "Update Listing"}
          </button>
          {error && <p className="text-red-700 text-sm">{error}</p>}
        </div>
      </form>
    </main>
  );
}
