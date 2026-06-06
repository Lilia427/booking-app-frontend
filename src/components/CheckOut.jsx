import { BsCalendar } from 'react-icons/bs';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import '../style/datepicker.css';
import { useRoomContext } from '../context/RoomContext';


const CheckOut = ({ excludedDateIntervals = [] }) => {

  const { checkIn, checkOut, setCheckOut } = useRoomContext();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const minCheckOutDate = checkIn || today;

  return (
    <div className='relative flex items-center justify-end h-full'>

      <div className='absolute z-10 pr-8'>
        <div><BsCalendar className='text-accent text-base' /> </div>
      </div>

      <DatePicker
        className='w-full h-full'
        selected={checkOut}
        minDate={minCheckOutDate}
        excludeDateIntervals={excludedDateIntervals}
        placeholderText='Дата виїзду'
        dateFormat='dd/MM/yyyy'
        onChange={(date) => setCheckOut(date)}
      />

    </div>
  );
};

export default CheckOut;
