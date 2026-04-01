import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import SwiperCore from "swiper";
import "swiper/css/bundle";
import ListingItem from "../components/ListingItem";

export default function Home() {
  const [offerListings, setOfferListings] = useState([]);
  const [saleListings, setSaleListings] = useState([]);
  const [rentListings, setRentListings] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isWakingServer, setIsWakingServer] = useState(false);

  SwiperCore.use([Navigation]);
  console.log(offerListings);

  // PUT THE NEW CODE RIGHT HERE:
  if (offerListings && offerListings.length > 0) {
    console.log("Image URL:", offerListings[0].imageUrls[0]);
  }

  useEffect(() => {
    // start the 5 second timer to wake up the server
    const wakeTimer = setTimeout(() => {
      setIsWakingServer(true); // If 5 seconds pass, the server is likely waking up
    }, 5000);

    const fetchAllListings = async () => {
      try {
        setIsLoading(true); // Start loading when we begin fetching

        // Fetch Offers
        const resOffer = await fetch("/api/listing/get?offer=true&limit=4");
        const dataOffer = await resOffer.json();
        setOfferListings(dataOffer);

        // Fetch Rend
        const resRent = await fetch("/api/listing/get?type=rent&limit=4");
        const dataRent = await resRent.json();
        setRentListings(dataRent);

        // Fetch Sale
        const resSale = await fetch("/api/listing/get?type=sale&limit=4");
        const dataSale = await resSale.json();
        setSaleListings(dataSale);
      } catch (error) {
        console.log(error);
      } finally {
        // Clear the loading state and turn off loading
        clearTimeout(wakeTimer);
        setIsWakingServer(false);
        setIsLoading(false);
      }
    };
    fetchAllListings();
    // Cleanup the timer if ueser leave
    return () => clearTimeout(wakeTimer);
  }, []);

  // Smart Loading UI: Show a message if the server is waking up, otherwise show the listings
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        {/* Spinning Circle */}
        <div className="w-16 h-16 border-4 border-slate-300 border-t-indigo-600 rounded-full animate-spin"></div>

        {/* Dynamic Text */}
        {isWakingServer ? (
          <div className="text-center animate-pulse px-4">
            <p className="text-amber-600 font-semibold text-xl">
              Our free server is waking up from a nap! 😴
            </p>
            <p className="text-gray-500 text-sm mt-2">
              This usually takes about 40-50 seconds. Thanks for your patience!
              🚀
            </p>
          </div>
        ) : (
          <p className="text-gray-500 text-lg animate-pulse font-semibold">
            Loading Mickey estates...
          </p>
        )}
      </div>
    );
  }

  // Main content when data is loading successfully
  return (
    <div>
      {/* top */}
      <div className="flex flex-col gap-6 p-28 px-3 max-w-6xl mx-auto">
        <h1 className="text-indigo-700 font-bold text-3xl lg:text-6xl">
          Find your next
          <span className="text-indigo-400"> Perfect</span> <br />
          place with ease
        </h1>
        <div className="text-slate-400 text-xs sm:text-sm">
          Mickey Estate is the best place to find your next perfect place to
          live.
          <br />
          We have a great range of properties for you to choose from.
        </div>
        <Link
          to={"/search"}
          className="text-xs sm:text-sm text-blue-800 font-bold hover:underline"
        >
          Let's get started...
        </Link>
      </div>

      {/* swiper */}
      <Swiper navigation>
        {offerListings &&
          offerListings.length > 0 &&
          offerListings.map((listing) => (
            <SwiperSlide key={listing._id}>
              <div
                style={{
                  background: `url(${listing.imageUrls[0]}) center no-repeat`,
                  backgroundSize: "cover",
                }}
                className="h-[500px]"
              ></div>
            </SwiperSlide>
          ))}
      </Swiper>

      {/* listing results for offer, sale and rent */}
      <div className="max-w-6xl mx-auto p-3 flex flex-col gap-8 my-10">
        {offerListings && offerListings.length > 0 && (
          <div className="">
            <div className="my-3">
              <h2 className="text-2xl font-semibold text-indigo-600">
                Recent offers
              </h2>
              <Link
                className="text-sm text-indigo-800 hover:underline"
                to={"/search?offer=true"}
              >
                Show more offers
              </Link>
            </div>
            <div className="flex flex-wrap gap-4">
              {offerListings.map((listing) => (
                <ListingItem listing={listing} key={listing._id} />
              ))}
            </div>
          </div>
        )}
        {rentListings && rentListings.length > 0 && (
          <div className="">
            <div className="my-3">
              <h2 className="text-2xl font-semibold text-indigo-600">
                Recent places for rent
              </h2>
              <Link
                className="text-sm text-blue-800 hover:underline"
                to={"/search?type=rent"}
              >
                Show more places for rent
              </Link>
            </div>
            <div className="flex flex-wrap gap-4">
              {rentListings.map((listing) => (
                <ListingItem listing={listing} key={listing._id} />
              ))}
            </div>
          </div>
        )}
        {saleListings && saleListings.length > 0 && (
          <div className="">
            <div className="my-3">
              <h2 className="text-2xl font-semibold text-indigo-600">
                Recent places for sale
              </h2>
              <Link
                className="text-sm text-blue-800 hover:underline"
                to={"/search?type=sale"}
              >
                Show more places for sale
              </Link>
            </div>
            <div className="flex flex-wrap gap-4">
              {saleListings.map((listing) => (
                <ListingItem listing={listing} key={listing._id} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
