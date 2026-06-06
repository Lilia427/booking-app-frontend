import { useMemo } from 'react';
import { useRoomContext } from '../context/RoomContext';
import { BsChevronDown } from 'react-icons/bs';
import { getKidsOptions } from '../constants/data';
import { Menu } from '@headlessui/react';


const KidsDropdown = ({ maxGuests = 1 }) => {

  const { adults, kids, setKids } = useRoomContext();
  const adultCount = parseInt(adults, 10) || 1;

  const kidsOptions = useMemo(
    () => getKidsOptions(maxGuests, adultCount),
    [maxGuests, adultCount]
  );


  return (
    <Menu as='div' className='w-full h-full bg-white relative'>


      <Menu.Button className='w-full h-full flex items-center justify-between px-8'>
        {kids === '0 дітей' ? 'Без дітей' : kids}
        <BsChevronDown className='text-base text-accent-hover' />
      </Menu.Button>


      <Menu.Items as='ul' className='bg-white absolute w-full flex flex-col z-40'>
        {
          kidsOptions.map(({ name, value }) =>
            <Menu.Item
              as='li'
              key={value}
              onClick={() => setKids(name)}
              className='border-b last-of-type:border-b-0 h-10 hover:bg-accent hover:text-white w-full flex items-center justify-center cursor-pointer'
            >
              {name === '0 дітей' ? 'Без дітей' : name}
            </Menu.Item>
          )
        }
      </Menu.Items>


    </Menu>
  );
};

export default KidsDropdown;
