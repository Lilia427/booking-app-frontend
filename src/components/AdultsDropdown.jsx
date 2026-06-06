import { useMemo } from 'react';
import { useRoomContext } from '../context/RoomContext';
import { BsChevronDown } from 'react-icons/bs';
import { formatKidsLabel, getAdultsOptions } from '../constants/data';
import { Menu } from '@headlessui/react';


const AdultsDropdown = ({ maxGuests = 1 }) => {

  const { adults, setAdults, kids, setKids } = useRoomContext();

  const adultsOptions = useMemo(
    () => getAdultsOptions(maxGuests),
    [maxGuests]
  );

  const handleSelect = (name, value) => {
    setAdults(name);

    const kidCount = parseInt(kids, 10) || 0;
    const maxKids = Math.max(0, maxGuests - value);

    if (kidCount > maxKids) {
      setKids(formatKidsLabel(maxKids));
    }
  };


  return (
    <Menu as='div' className='w-full h-full bg-white relative'>


      <Menu.Button className='w-full h-full flex items-center justify-between px-8'>
        {adults}
        <BsChevronDown className='text-base text-accent-hover' />
      </Menu.Button>


      <Menu.Items as='ul' className='bg-white absolute w-full flex flex-col z-40'>
        {
          adultsOptions.map(({ name, value }) =>
            <Menu.Item
              as='li'
              key={value}
              onClick={() => handleSelect(name, value)}
              className='border-b last-of-type:border-b-0 h-10 hover:bg-accent hover:text-white w-full flex items-center justify-center cursor-pointer'
            >
              {name}
            </Menu.Item>
          )
        }
      </Menu.Items>


    </Menu>
  );
};

export default AdultsDropdown;
