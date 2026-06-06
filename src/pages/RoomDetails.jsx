import { AdultsDropdown, CheckIn, CheckOut, KidsDropdown, ScrollToTop } from '../components';
import { useRoomContext } from '../context/RoomContext';
import { formatAdultsLabel, formatKidsLabel } from '../constants/data';
import { useParams } from 'react-router-dom';
import { FaCheck, FaCheckCircle, FaExclamationCircle, FaTimes } from 'react-icons/fa';
import { useCallback, useEffect, useMemo, useState } from 'react';

const COTTAGES_API_URL = 'https://api.runabooking.me/api/cottages';

const RoomDetails = () => {

  const { id } = useParams();
  const { rooms, adults, kids, checkIn, checkOut, setAdults, setKids } = useRoomContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookedDateRanges, setBookedDateRanges] = useState([]);
  const [apiCottage, setApiCottage] = useState(null);
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'error',
  });

  const room = rooms.find(room => room.id === +id);
  const roomTypeId = Number(id);

  useEffect(() => {
    if (!roomTypeId) {
      setApiCottage(null);
      return;
    }

    const controller = new AbortController();

    const loadCottageById = async () => {
      try {
        const response = await fetch(`${COTTAGES_API_URL}/${id}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Failed to load cottage by id: ${response.status}`);
        }

        const data = await response.json().catch(() => null);
        const entity = data?.data ?? data;
        setApiCottage(entity ?? null);
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Cottage details load error:', error);
          setApiCottage(null);
        }
      }
    };

    loadCottageById();

    return () => controller.abort();
  }, [roomTypeId]);

  const name = apiCottage?.name || room?.name;
  const description = apiCottage?.description || room?.description;
  const facilities = room?.facilities ?? [];
  const price = apiCottage?.pricePerNight ?? room?.price;
  const maxGuests = Number(apiCottage?.maxGuests ?? room?.maxGuests ?? room?.maxPerson) || 1;
  const imageLg = room?.imageLg;
  const gallery = room?.gallery;

  const apiImageUrls = Array.isArray(apiCottage?.imageUrls)
    ? apiCottage.imageUrls.filter((img) => typeof img === 'string' && img.trim().length > 0)
    : [];

  const roomGallery = apiImageUrls.length
    ? apiImageUrls
    : Array.isArray(gallery) && gallery.length
      ? gallery
      : [imageLg].filter(Boolean);

  const formatDateForApi = (date) => {
    if (!date) return '';
    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) return '';

    const dateOnly = new Date(
      parsedDate.getFullYear(),
      parsedDate.getMonth(),
      parsedDate.getDate()
    );

    return dateOnly.toISOString();
  };

  const cottageNameById = {
    1: 'Котедж Полонина',
    2: 'Котедж Затишок',
    3: 'Котедж Верховини',
  };

  const parseApiDate = (value) => {
    if (!value) return null;

    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [year, month, day] = value.split('-').map(Number);
      return new Date(year, month - 1, day);
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  };

  const normalizeDateOnly = (value) => {
    if (!value) return null;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  };

  const rangesOverlap = (startA, endA, startB, endB) => {
    return startA <= endB && startB <= endA;
  };

  const isValidPhoneNumber = (value) => {
    const normalized = String(value || '').replace(/[\s()-]/g, '');
    return /^\+?\d{10,15}$/.test(normalized);
  };

  const showModal = ({ title, message, type = 'error' }) => {
    setModalState({ isOpen: true, title, message, type });
  };

  const closeModal = () => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
  };

  const loadBookedDates = useCallback(async (signal) => {
    if (!roomTypeId) {
      setBookedDateRanges([]);
      return;
    }

    try {
      const response = await fetch(
        `https://api.runabooking.me/api/reservation/booked-dates/${roomTypeId}`,
        signal ? { signal } : undefined
      );

      if (!response.ok) {
        throw new Error(`Failed to load booked dates: ${response.status}`);
      }

      const data = await response.json();
      const intervals = Array.isArray(data)
        ? data
            .map((item) => {
              const start = parseApiDate(item.checkIn);
              const end = parseApiDate(item.checkOut);

              if (!start || !end) return null;

              return {
                start: start <= end ? start : end,
                end: end >= start ? end : start,
              };
            })
            .filter(Boolean)
        : [];

      setBookedDateRanges(intervals);
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Booked dates load error:', error);
        setBookedDateRanges([]);
      }
    }
  }, [roomTypeId]);

  useEffect(() => {
    const controller = new AbortController();

    loadBookedDates(controller.signal);

    return () => controller.abort();
  }, [loadBookedDates]);

  useEffect(() => {
    const adultCount = parseInt(adults, 10) || 1;
    const kidCount = parseInt(kids, 10) || 0;
    const clampedAdults = Math.min(Math.max(adultCount, 1), maxGuests);
    const clampedKids = Math.min(Math.max(kidCount, 0), Math.max(0, maxGuests - clampedAdults));

    if (clampedAdults !== adultCount) {
      setAdults(formatAdultsLabel(clampedAdults));
    }

    if (clampedKids !== kidCount) {
      setKids(formatKidsLabel(clampedKids));
    }
  }, [maxGuests, roomTypeId]);

  const excludedDateIntervals = useMemo(
    () => bookedDateRanges.map((range) => ({ start: range.start, end: range.end })),
    [bookedDateRanges]
  );

  const selectedDays = useMemo(() => {
    const start = normalizeDateOnly(checkIn);
    const end = normalizeDateOnly(checkOut);

    if (!start || !end) return 1;

    const diffInMs = end.getTime() - start.getTime();
    const diffInDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));

    return diffInDays > 0 ? diffInDays : 1;
  }, [checkIn, checkOut]);

  const guestCount = useMemo(() => {
    const adultCount = parseInt(adults, 10) || 0;
    const kidCount = parseInt(kids, 10) || 0;
    const total = adultCount + kidCount;

    return total > 0 ? total : 1;
  }, [adults, kids]);

  const pricePerPersonPerNight = Number(price) || 0;
  const totalPrice = pricePerPersonPerNight * guestCount * selectedDays;

  const hotelRulesUa = [
    'Заселення після 14:00, виселення до 11:00.',
    'Будь ласка, дотримуйтеся тиші з 22:00 до 08:00.',
    'Куріння в приміщенні заборонене.',
    'Бережно ставтеся до майна котеджу.',
    'Проживання з тваринами можливе за попереднім погодженням.',
  ];

  const handleReservationSubmit = async (e) => {
    e.preventDefault();

    const form = e.currentTarget;

    const formData = new FormData(form);
    const guestName = String(formData.get('name') || '').trim();
    const phone = String(formData.get('phone') || '').trim();
    const reservationName = cottageNameById[roomTypeId] || name || guestName;

    const payload = {
      checkIn: formatDateForApi(checkIn),
      checkOut: formatDateForApi(checkOut),
      adults: parseInt(adults, 10) || 0,
      children: parseInt(kids, 10) || 0,
      roomType: roomTypeId,
      roomName: reservationName,
      name: guestName,
      phone,
      status: 'pending',
    };

    if (!payload.checkIn || !payload.checkOut || !payload.name || !payload.phone) {
      showModal({
        title: 'Перевірте форму',
        message: 'Вкажіть дати заїзду/виїзду, імʼя та номер телефону.',
      });
      return;
    }

    if (!isValidPhoneNumber(payload.phone)) {
      showModal({
        title: 'Некоректний номер',
        message: 'Введіть коректний номер телефону у форматі +380XXXXXXXXX або 0XXXXXXXXX.',
      });
      return;
    }

    const selectedCheckIn = normalizeDateOnly(checkIn);
    const selectedCheckOut = normalizeDateOnly(checkOut);

    if (!selectedCheckIn || !selectedCheckOut) {
      showModal({
        title: 'Некоректні дати',
        message: 'Оберіть коректні дати заїзду та виїзду.',
      });
      return;
    }

    if (selectedCheckOut < selectedCheckIn) {
      showModal({
        title: 'Некоректний діапазон',
        message: 'Дата виїзду не може бути раніше дати заїзду.',
      });
      return;
    }

    const hasDateConflict = bookedDateRanges.some((range) =>
      rangesOverlap(selectedCheckIn, selectedCheckOut, range.start, range.end)
    );

    if (hasDateConflict) {
      showModal({
        title: 'Дати недоступні',
        message: 'Обраний період уже заброньований. Будь ласка, оберіть інші дати.',
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch('https://api.runabooking.me/api/reservation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let serverMessage = `Reservation failed (${response.status}).`;

        try {
          const errorData = await response.json();
          if (errorData?.message) {
            serverMessage = errorData.message;
          }
        } catch (_parseError) {
        }

        throw new Error(serverMessage);
      }


      showModal({
        title: 'Бронювання відправлено',
        message: 'Дякуємо! Ми отримали заявку і скоро з вами звʼяжемось.',
        type: 'success',
      });
      await loadBookedDates();
      form.reset();
    } catch (error) {
      console.error('Reservation submit error:', error);
      showModal({
        title: 'Помилка відправки',
        message: error instanceof Error ? error.message : 'Не вдалося відправити бронювання. Спробуйте ще раз.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section>

      <ScrollToTop />

      <div
        className='h-[560px] relative flex justify-center items-center bg-cover bg-center'
        style={roomGallery[0] ? { backgroundImage: `url(${roomGallery[0]})` } : undefined}
      >
        <div className='absolute w-full h-full bg-black/70' />
        <h1 className='text-5xl text-white z-20 font-primary text-center'>{name} Деталі</h1>
      </div>


      <div className='container mx-auto'>
        <div className='flex flex-col lg:flex-row lg:gap-x-8 h-full py-24'>

          <div className='w-full lg:w-[60%] h-full text-justify'>

            <h2 className='h2'>{name}</h2>
            <p className='mb-8'>{description}</p>
            <div className='flex flex-col gap-6 mb-8'>
              {
                roomGallery.map((img, index) => (
                  <figure key={`${name}-photo-${index}`} className='w-full'>
                    <img
                      className='w-full h-[340px] lg:h-[420px] object-cover rounded-md'
                      src={img}
                      alt={`${name} фото ${index + 1}`}
                    />
                  </figure>
                ))
              }
            </div>

            <div className='mt-12'>
              <h3 className='h3 mb-3'></h3>
              <p className='mb-12'>Цей котедж ідеально підходить для спокійного відпочинку в будь-яку пору року. Просторий інтер&apos;єр, зручне планування та продумані деталі створюють комфортну атмосферу для пар, сімей і невеликих компаній. Тут легко поєднати затишок, тишу та якісний сервіс, щоб повністю насолодитися відпусткою.</p>

              <div className="grid grid-cols-3 gap-6 mb-12">
                {
                  facilities.map((item, index) =>
                    <div key={index} className='flex items-center gap-x-3 flex-1'>
                      <div className='text-3xl text-accent'>{<item.icon />}</div>
                      <div className='text-base'>{item.name}</div>
                    </div>
                  )
                }
              </div>
            </div>

          </div>


          <div className='w-full lg:w-[40%] h-full'>

            <div className='py-8 px-6 bg-accent/20 mb-12'>

              <form onSubmit={handleReservationSubmit}>
                <div className='flex flex-col space-y-4 mb-4'>
                  <h3>Ваше бронювання</h3>
                  <div className='h-[60px]'> <CheckIn excludedDateIntervals={excludedDateIntervals} /> </div>
                  <div className='h-[60px]'> <CheckOut excludedDateIntervals={excludedDateIntervals} /> </div>
                  <div className='h-[60px]'> <AdultsDropdown maxGuests={maxGuests} /> </div>
                  <div className='h-[60px]'> <KidsDropdown maxGuests={maxGuests} /> </div>
                  <div className='h-[60px]'>
                    <input
                      type='text'
                      name='name'
                      placeholder='Ваше імʼя'
                      className='w-full h-full bg-white px-6 outline-none'
                      required
                    />
                  </div>
                  <div className='h-[60px]'>
                    <input
                      type='tel'
                      name='phone'
                      placeholder='Ваш номер телефону'
                      className='w-full h-full bg-white px-6 outline-none'
                      pattern='^\+?[0-9\s()\-]{10,20}$'
                      title='Введіть номер телефону: +380XXXXXXXXX або 0XXXXXXXXX'
                      inputMode='tel'
                      autoComplete='tel'
                      required
                    />
                  </div>
                </div>
                <button type='submit' disabled={isSubmitting} className='btn btn-lg btn-primary w-full'>
                  {isSubmitting ? 'відправка...' : `Резерв за ${totalPrice} грн`}
                </button>
              </form>
            </div>

            <div>
              <h3 className='h3'>Правила проживання</h3>
              <p className='mb-6 text-justify'>
                Щоб відпочинок був комфортним для всіх гостей, просимо ознайомитися з основними правилами проживання. Вони прості та допомагають зберегти затишок, чистоту і спокійну атмосферу на території котеджу.
              </p>

              <ul className='flex flex-col gap-y-4'>
                {hotelRulesUa.map((rule, idx) => (
                  <li key={idx} className='flex items-center gap-x-4'>
                    <FaCheck className='text-accent' />
                    {rule}
                  </li>
                ))}
              </ul>
            </div>

          </div>

        </div>
      </div>

      {modalState.isOpen && (
        <div className='fixed inset-0 z-[100] flex items-center justify-center px-4'>
          <button
            type='button'
            className='absolute inset-0 bg-black/60 backdrop-blur-sm'
            onClick={closeModal}
            aria-label='Close modal backdrop'
          />

          <div className='relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-[fadeIn_.25s_ease]'>
            <button
              type='button'
              onClick={closeModal}
              className='absolute right-4 top-4 text-gray-400 transition hover:text-gray-700'
              aria-label='Close modal'
            >
              <FaTimes />
            </button>

            <div className='mb-4 flex items-center gap-3'>
              <div
                className={`grid h-11 w-11 place-items-center rounded-full ${
                  modalState.type === 'success'
                    ? 'bg-green-100 text-green-600'
                    : 'bg-red-100 text-red-600'
                }`}
              >
                {modalState.type === 'success' ? <FaCheckCircle /> : <FaExclamationCircle />}
              </div>
              <h4 className='text-xl font-semibold text-primary'>{modalState.title}</h4>
            </div>

            <p className='mb-6 text-[15px] leading-relaxed text-gray-600'>{modalState.message}</p>

            <button
              type='button'
              onClick={closeModal}
              className={`w-full rounded-lg px-4 py-3 text-sm font-semibold text-white transition ${
                modalState.type === 'success'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-primary hover:bg-primary/90'
              }`}
            >
              Зрозуміло
            </button>
          </div>
        </div>
      )}

    </section>
  );
};

export default RoomDetails;
