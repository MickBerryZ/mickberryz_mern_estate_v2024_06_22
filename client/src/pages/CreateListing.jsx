import { useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import Map from "../components/Map";

export default function CreateListing() {
  const { currentUser } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [formData, setFormData] = useState({
    imageUrls: [],
    name: "",
    description: "",
    address: "",
    type: "rent",
    bedrooms: 1,
    bathrooms: 1,
    regularPrice: 1,
    discountPrice: 0,
    offer: false,
    parking: false,
    furnished: false,
  });
  const [imageUploadError, setImageUploadError] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [addressVerified, setAddressVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [mapAddress, setMapAddress] = useState("London");

  const handleImageSubmit = async () => {
    if (files.length > 0 && files.length + formData.imageUrls.length < 7) {
      setUploading(true);
      setImageUploadError(false);
      const uploadData = new FormData();
      for (let i = 0; i < files.length; i++) {
        uploadData.append("images", files[i]);
      }
      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          body: uploadData,
        });
        const data = await res.json();
        if (!res.ok) {
          setImageUploadError(data.error || "Upload failed");
          setUploading(false);
          return;
        }
        setFormData({
          ...formData,
          imageUrls: formData.imageUrls.concat(data),
        });
        setUploading(false);
      } catch (err) {
        setImageUploadError("Image upload failed (2 mb max per image)");
        setUploading(false);
      }
    } else {
      setImageUploadError("You can only upload 6 images per listing");
      setUploading(false);
    }
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

  const handleAddressSearch = async (e) => {
    const value = e.target.value;
    setFormData({ ...formData, address: value });
    setAddressVerified(false);

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
        setMapAddress(formData.address); //  Move map when user clicks "Verify"
        alert("Location found! Your map pin is ready.");
      } else {
        setAddressVerified(false);
        alert("Address not found. Try being more specific.");
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
        return setError("Upload at least one image");
      if (+formData.regularPrice < +formData.discountPrice)
        return setError("Discount price must be lower than regular price");
      if (!addressVerified)
        return setError("Please verify the address on the map first!");
      setLoading(true);
      const res = await fetch(`/api/listing/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, userRef: currentUser._id }),
      });
      const data = await res.json();
      setLoading(false);
      if (data.success === false) {
        setError(data.message);
        return;
      }
      navigate(`/listing/${data._id}`);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <main className="p-3 max-w-4xl mx-auto">
      <h1 className="text-3xl font-semibold text-center my-7">
        Create Listing
      </h1>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
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
            placeholder="Description"
            className="border p-3 rounded-lg"
            id="description"
            required
            onChange={handleChange}
            value={formData.description}
          />

          <div className="flex gap-6 flex-wrap mt-2">
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
                max="10000000"
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
                  max="10000000"
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

          {/* 📍 ADDRESS & AUTOCOMPLETE SECTION */}
          <div className="relative flex flex-col gap-2">
            <input
              type="text"
              placeholder="Address e.g. 123 Main St, City, Country"
              className="border p-3 rounded-lg w-full"
              id="address"
              required
              onChange={handleAddressSearch}
              value={formData.address}
            />
            {suggestions.length > 0 && (
              <ul className="absolute top-[52px] left-0 z-50 bg-white border w-full rounded-md shadow-2xl max-h-48 overflow-y-auto">
                {suggestions.map((place) => (
                  <li
                    key={place.place_id}
                    className="p-3 hover:bg-indigo-100 cursor-pointer text-sm border-b last:border-none"
                    onClick={() => {
                      setFormData({ ...formData, address: place.display_name });
                      setAddressVerified(place.display_name);
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
              className="text-green-700 border border-green-700 p-2 rounded-lg uppercase hover:bg-green-50 font-semibold text-sm"
            >
              {verifying ? "Checking..." : "Verify Address on Map"}
            </button>
            {addressVerified && (
              <p className="text-green-700 text-xs font-bold">
                ✓ Location verified
              </p>
            )}

            {/* 🗺️ VISUAL MAP PREVIEW */}
            <div className="mt-2 border-t pt-4">
              <p className="font-semibold mb-2 text-indigo-700 flex items-center gap-2">
                <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                Location Preview:
              </p>
              {/* If no address yet, it defaults to Bangkok. If they type, it moves! */}
              <Map key={formData} address={formData} />

              {!addressVerified && formData.address && (
                <p className="text-amber-600 text-xs mt-2 italic">
                  Note: Please click "Verify" before creating! saving.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col flex-1 gap-4">
          <p className="font-semibold text-gray-700">Images (max 6)</p>
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
              {uploading ? "Uploading..." : "Upload"}
            </button>
          </div>
          {imageUploadError && (
            <p className="text-red-700 text-sm">{imageUploadError}</p>
          )}
          <div className="flex flex-col gap-3">
            {formData.imageUrls.map((url, index) => (
              <div
                key={url}
                className="flex justify-between p-3 border items-center rounded-lg shadow-sm"
              >
                <img
                  src={url}
                  alt="listing"
                  className="w-20 h-20 object-contain rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="p-3 text-red-700 rounded-lg uppercase hover:opacity-75 font-semibold"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
          <button
            disabled={loading || uploading}
            className="p-3 bg-indigo-700 text-white rounded-lg uppercase hover:opacity-95 disabled:opacity-80 mt-4"
          >
            {loading ? "Creating..." : "Create Listing"}
          </button>
          {error && <p className="text-red-700 text-sm mt-2">{error}</p>}
        </div>
      </form>
    </main>
  );
}
