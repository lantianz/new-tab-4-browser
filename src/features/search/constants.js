export const DEFAULT_SEARCH_PAGE_CONFIG = {
  currentEngine: 'bing',
  isSearchContainerVisible: 'yes',
}

export const SEARCH_ENGINES = [
  {
    name: 'bing',
    title: 'bing',
    value: 'https://cn.bing.com/search?q={query}',
    icon: `
      <svg xmlns="http://www.w3.org/2000/svg" aria-label="Bing" role="img" viewBox="0 0 512 512">
        <path d="M145,73l73,26V356l103-59-50-24-32-79,162,57v83L218,439l-73-41Z" fill="#008373"></path>
      </svg>
    `,
  },
  {
    name: 'baidu',
    title: 'baidu',
    value: 'https://www.baidu.com/s?wd={query}',
    icon: `
      <svg xmlns="http://www.w3.org/2000/svg" aria-label="Baidu" role="img" viewBox="0 0 512 512">
        <path d="m131 251c41-9 35-58 34-68-2-17-21-45-48-43-33 3-37 50-37 50-5 22 10 70 51 61m76-82c22 0 40-26 40-58s-18-58-40-58c-23 0-41 26-41 58s18 58 41 58m96 4c31 4 50-28 54-53 4-24-16-52-37-57s-48 29-50 52c-3 27 3 54 33 58m120 41c0-12-10-47-46-47s-41 33-41 57c0 22 2 53 47 52s40-51 40-62m-46 102s-46-36-74-75c-36-57-89-34-106-5-18 29-45 48-49 53-4 4-56 33-44 84 11 52 52 51 52 51s30 3 65-5 65 2 65 2 81 27 104-25c22-53-13-80-13-80" fill="#2319dc"></path>
        <path d="m214 266v34h-28s-29 3-39 35c-3 21 4 34 5 36 1 3 10 19 33 23h53v-128zm-1 107h-21s-15-1-19-18c-3-7 0-16 1-20 1-3 6-11 17-14h22zm38-70v68s1 17 24 23h61v-91h-26v68h-25s-8-1-10-7v-61z" fill="#ffffff"></path>
      </svg>
    `,
  },
  {
    name: 'google',
    title: 'google',
    value: 'https://www.google.com/search?q={query}',
    icon: `
      <svg viewBox="-1.6 -1.6 19.20 19.20" xmlns="http://www.w3.org/2000/svg" fill="none">
        <path fill="#4285F4" d="M14.9 8.161c0-.476-.039-.954-.121-1.422h-6.64v2.695h3.802a3.24 3.24 0 01-1.407 2.127v1.75h2.269c1.332-1.22 2.097-3.02 2.097-5.15z"></path>
        <path fill="#34A853" d="M8.14 15c1.898 0 3.499-.62 4.665-1.69l-2.268-1.749c-.631.427-1.446.669-2.395.669-1.836 0-3.393-1.232-3.952-2.888H1.85v1.803A7.044 7.044 0 008.14 15z"></path>
        <path fill="#FBBC04" d="M4.187 9.342a4.17 4.17 0 010-2.68V4.859H1.849a6.97 6.97 0 000 6.286l2.338-1.803z"></path>
        <path fill="#EA4335" d="M8.14 3.77a3.837 3.837 0 012.7 1.05l2.01-1.999a6.786 6.786 0 00-4.71-1.82 7.042 7.042 0 00-6.29 3.858L4.186 6.66c.556-1.658 2.116-2.89 3.952-2.89z"></path>
      </svg>
    `,
  },
]
