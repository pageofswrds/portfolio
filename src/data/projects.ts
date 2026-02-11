export interface Project {
  id: string
  title: string
  subtitle: string
  date: string
  thumbnail: string
  order: number
}

export const projects: Project[] = [
  {
    id: 'cycles',
    title: 'Cycles',
    subtitle: 'XR prototyping',
    date: 'Aug 2024',
    thumbnail: 'https://schultzdavidg-portfolio.s3.us-west-1.amazonaws.com/images/cycles/hero2.jpg',
    order: 1,
  },
  {
    id: 'kairos',
    title: 'Kairos',
    subtitle: 'iOS app design',
    date: '2024',
    thumbnail: 'https://schultzdavidg-portfolio.s3.us-west-1.amazonaws.com/images/kairos/kairos-thumbnail.png',
    order: 2,
  },
  {
    id: 'sureui',
    title: 'SureUI',
    subtitle: 'Design system',
    date: '2023',
    thumbnail: 'https://schultzdavidg-portfolio.s3.us-west-1.amazonaws.com/images/dv/dv-cover.png',
    order: 3,
  },
  {
    id: 'acquire',
    title: 'Acquire Demo',
    subtitle: 'Form design',
    date: 'Jul 2023',
    thumbnail: 'https://schultzdavidg-portfolio.s3.us-west-1.amazonaws.com/images/aq/aq_overview.png',
    order: 4,
  },
  {
    id: 'arboretum',
    title: 'Arboretum',
    subtitle: 'Data visualization',
    date: 'Jun 2023',
    thumbnail: 'https://schultzdavidg-portfolio.s3.us-west-1.amazonaws.com/images/arboretum/arb_cover.jpg',
    order: 5,
  },
  {
    id: 'terrarium',
    title: 'TerrariumXR',
    subtitle: 'XR experience',
    date: '2023',
    thumbnail: 'https://schultzdavidg-portfolio.s3.us-west-1.amazonaws.com/images/terrariumxr/outside-render.jpg',
    order: 6,
  },
]
