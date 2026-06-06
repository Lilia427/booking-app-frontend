import { BsCalendar } from 'react-icons/bs';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import '../style/datepicker.css';
import { useRoomContext } from '../context/RoomContext';


const CheckIn = ({ excludedDateIntervals = [] }) => {

  const { checkIn, checkOut, setCheckIn, setCheckOut } = useRoomContext();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const handleCheckInChange = (date) => {
    setCheckIn(date);

    if (checkOut && date && checkOut < date) {
      setCheckOut(null);
    }
  };

  return (
    <div className='relative flex items-center justify-end h-full'>

      <div className='absolute z-10 pr-8'>
        <div><BsCalendar className='text-accent text-base' /> </div>
      </div>

      <DatePicker
        className='w-full h-full'
        selected={checkIn}
        minDate={today}
        excludeDateIntervals={excludedDateIntervals}
        placeholderText='Дата заїзду'
        dateFormat='dd/MM/yyyy'
        onChange={handleCheckInChange}
      />

    </div>
  );
};

export default CheckIn;
