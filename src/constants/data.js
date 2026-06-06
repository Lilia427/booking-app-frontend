import { FaCheck } from "react-icons/fa";
import images from "../assets";


export const formatAdultsLabel = (count) => {
  if (count === 1) return '1 дорослий';
  return `${count} дорослих`;
};

export const formatKidsLabel = (count) => {
  if (count === 0) return '0 дітей';
  if (count === 1) return '1 дитина';
  return `${count} дітей`;
};

export const getAdultsOptions = (maxGuests) => {
  const max = Math.max(1, Number(maxGuests) || 1);

  return Array.from({ length: max }, (_, index) => ({
    value: index + 1,
    name: formatAdultsLabel(index + 1),
  }));
};

export const getKidsOptions = (maxGuests, adultCount) => {
  const adults = Math.max(1, Number(adultCount) || 1);
  const maxKids = Math.max(0, (Number(maxGuests) || 1) - adults);

  return Array.from({ length: maxKids + 1 }, (_, index) => ({
    value: index,
    name: formatKidsLabel(index),
  }));
};

export const adultsList = [
    { name: '1 дорослий' },
    { name: '2 дорослих' },
    { name: '3 дорослих' },
    { name: '4 дорослих' },
]


export const kidsList = [
    { name: '0 дітей' },
    { name: '1 дитина' },
    { name: '2 дітей' },
    { name: '3 дітей' },
    { name: '4 дітей' },
]


export const sliderData = [
    {
        id: 1,
        title: 'Ваш котедж для відпочинку',
        bg: images.Slider1,
        btnNext: 'Переглянути наші кімнати',
    },
    {
        id: 2,
        title: 'Відчуйте релакс та насолоджуйтесь',
        bg: images.Slider2,
        btnNext: 'Переглянути наші кімнати',
    },
    {
        id: 3,
        title: 'Ваш котедж для відпочинку',
        bg: images.Slider3,
        btnNext: 'Переглянути наші кімнати',
    },
]


export const hotelRules = [
    {
        rules: 'Check-in : 3:00 PM - 9:00 PM',
    },
    {
        rules: 'Check-out : 10:30 AM',
    },
    {
        rules: 'No Smoking',
    },
    {
        rules: 'No Pet',
    },
]