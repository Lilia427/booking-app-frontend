import { BsPeople } from 'react-icons/bs';
import { Link } from 'react-router-dom';

const Room = ({ room }) => {

  const { id, name, imageUrls, image, maxGuests, maxPerson, description, pricePerNight, price } = room ?? {};
  const displayImage = (Array.isArray(imageUrls) && imageUrls[0]) || image;
  const displayPrice = pricePerNight ?? price;
  const displayMaxPersons = maxGuests ?? maxPerson;

  return (
    <div className='bg-white shadow-2xl min-h-[500px] group'>

      <div className='overflow-hidden'>
        <img src={displayImage} alt="img" className='group-hover:scale-110 transition-all duration-300 w-full h-[220px] object-cover' />
      </div>


      <div className='bg-white shadow-lg max-w-[300px] mx-auto h-[60px] -translate-y-1/2 flex justify-center items-center uppercase font-tertiary tracking-[1px] font-semibold text-base'>

        <div className='flex justify-center w-full'>
          <div className='flex items-center gap-x-2'>
            <div className='text-accent'>
              <BsPeople className='text-[18px]' />
            </div>
            <div className='flex gap-x-1'>
              <div>Максимум людей</div>
              <div>{displayMaxPersons}</div>
            </div>
          </div>

        </div>

      </div>


      <div className='text-center'>
        <Link to={`/room/${id}`}>
          <p className="h3">{name}</p>
        </Link>

        <p className='max-w-[300px] mx-auto mb-3 lg:mb-6'>{description?.length > 56 ? description.slice(0, 56) + '..' : description}</p>
      </div>


      <Link
        to={`/room/${id}`}
        className="btn btn-secondary btn-sm max-w-[240px] mx-auto duration-300 normal-case text-center flex justify-center"
      >
       Резерв за <br /> {displayPrice} грн
      </Link>

    </div>
  );

};

export default Room;
