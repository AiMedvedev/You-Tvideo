const API_KEY = 'AIzaSyCYk3FFcQ6RztLKGwjKwsznGlIQOa7jQy4';
const VIDEOS_URL = 'https://www.googleapis.com/youtube/v3/videos';
const SEARCH_URL = 'https://www.googleapis.com/youtube/v3/search';

const favouriteIds = JSON.parse(localStorage.getItem('favouriteVideos') || "[]");

const router = new Navigo('/', { hash: true });
const main = document.querySelector('main');

const preload = {
    elem: document.createElement('div'),
    text: '<p class="preload__text">Загрузка...</p>',
    append() {
        main.style.display = 'flex';
        main.style.margin = 'auto';
        main.append(this.elem);
    },
    remove() {
        main.style.display = '';
        main.style.margin = '';
        this.elem.remove();
    },
    init() {
        this.elem.className = 'preload';
        this.elem.innerHTML = this.text;
    }
}

const fetchTrendingVideos = async (amount) => {
    try {
        const url = new URL(VIDEOS_URL);
        url.searchParams.append('part', 'id,contentDetails,snippet');
        url.searchParams.append('chart', 'mostPopular');
        url.searchParams.append('regionCode', 'RU');
        url.searchParams.append('maxResults', amount);
        url.searchParams.append('key', API_KEY);
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('error : ', error);
    }
}

const fetchFavouriteVideos = async () => {
    try {
        const url = new URL(VIDEOS_URL);

        if (favouriteIds.length === 0) {
            return {items: []};
        }

        url.searchParams.append('part', 'id,contentDetails,snippet');
        url.searchParams.append('maxResults', 12);
        url.searchParams.append('id', favouriteIds.join(","));
        url.searchParams.append('key', API_KEY);
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('error : ', error);
    }
}

const fetchChosenVideo = async (id) => {
    try {
        const url = new URL(VIDEOS_URL);

        url.searchParams.append('part', 'snippet,statistics');
        url.searchParams.append('id', id);
        url.searchParams.append('key', API_KEY);

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('error : ', error);
    }
}

const fetchSearchedVideos = async (query, page) => {
    try {
        const url = new URL(SEARCH_URL);

        url.searchParams.append('part', 'snippet');
        url.searchParams.append('q', query);
        url.searchParams.append('type', 'video');
        url.searchParams.append('key', API_KEY);

        const response = await fetch(url);

        if (page) {
            url.searchParams.append('pageToken', page);
        }

        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('error : ', error);
    }
}

const createVideoList = (videos, titleText, pagination) => {
    const videoListSection = document.createElement('section');
    const container = document.createElement('div');
    const title = document.createElement('h2');
    const videoListItems = document.createElement('ul');

    videoListSection.className = 'video-list';
    container.className = 'container';
    title.className = 'video-list__title';
    videoListItems.className = 'video-list__items';
    title.textContent = titleText;


    const videoList = videos.items.map(video => {
        const li = document.createElement('li');
        const id = video.id.videoId || video.id;
        li.classList.add('video-list__item');

        li.innerHTML = `
        <article class="video-card">
            <a href="#/video/${id}" class="video-card__link">
                <img src="${video.snippet.thumbnails.high?.url ||
                            video.snippet.thumbnails.standart?.url}" alt="Превью видео ${video.snippet.title}"
                    class="video-card__thumbnail">
                <h3 class="video-card__title">${video.snippet.title}</h3>
                <p class="video-card__channel">${video.snippet.channelTitle}</p>
                ${video.contentDetails ? `<p class="video-card__duration">${convertDuration(video.contentDetails.duration)}</p>` : ''}
            </a>
            <button class="video-card__favourite favourite ${
                favouriteIds.includes(id) ? 'active' : ''
            }" type="button" aria-label="Добавить в избранное" data-video-id="${id}">
                <svg class="favourite__icon">
                    <use class="star-o" xlink:href="/image/sprite.svg#star-bw" />
                    <use class="star" xlink:href="/image/sprite.svg#star" />
                </svg>
            </button>
        </article>
        `;
        return li;
    });

    videoListItems.append(...videoList);
    container.append(title, videoListItems);
    videoListSection.append(container);

    if (pagination) {
        const paginationElem = document.createElement('div');
        const arrowNext = document.createElement('a');
        const arrowPrev = document.createElement('a');

        paginationElem.className = 'pagination';

        if (pagination.prev) {
            arrowPrev.className = 'pagination__prev';
            arrowPrev.text = 'Предыдущая страница';
            arrowPrev.href = `#/search?q=${pagination.query}&page=${pagination.prev}`;
            paginationElem.append(arrowPrev);
        }

        if (pagination.next) {
            arrowNext.className = 'pagination__next';
            arrowNext.text = 'Следующая страница';
            arrowNext.href = `#/search?q=${pagination.query}&page=${pagination.next}`;
            paginationElem.append(arrowNext);
        }

        videoListSection.append(paginationElem);
    }

    return videoListSection;
}

const createVideo = (video) => {
    const videoSection = document.createElement('section');

    videoSection.className = 'video';

    videoSection.innerHTML = `
        <div class="container">
            <div class="video__player">
                <iframe class="video__iframe" src="https://youtube.com/embed/${video.id}" frameborder="0"
                    allowfullscreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share">
                </iframe>
            </div>
            <div class="video__container">
                <div class="video__content">
                    <h2 class="video-list__title">${video.snippet.title}</h2>
                    <p class="video-card__channel">${video.snippet.channelTitle}</p>
                    <p class="video-card__info">
                        <span class="video-card__views">${parseInt(video.statistics.viewCount).toLocaleString()} просмотр</span>
                        <span class="video-card__date">Дата премьеры: ${formatDate(video.snippet.publishedAt)}</span>
                    </p>
                    <p class="video-card__description">${video.snippet.description}</p>
                </div>
                <button href="#/favourite" class="video__link favourite ${
                    favouriteIds.includes(video.id) ? 'active' : ''
                }" data-video-id="${video.id}">
                    <span class="video__favourite">В избранном</span>
                    <span class="video__no-favourite">В избранное</span>
                    <svg class="video__icon video__favourite">
                        <use xlink:href="/image/sprite.svg#star"/>
                    </svg>
                    <svg class="video__icon video__no-favourite">
                        <use xlink:href="/image/sprite.svg#star-ob"/>
                    </svg>
                </button>
            </div>
        </div>
    `;

    return videoSection;
}

const formatDate = (str) => {
    const date = new Date(str);
    const formatter = new Intl.DateTimeFormat("ru-RU", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });

    return formatter.format(date);
}

const convertDuration = (isoDuration) => {
    const result = isoDuration
        .slice(2)
        .replace("H", " ч ")
        .replace("M", " мин ")
        .replace("S", " сек");
    return result;
}


const createHero = () => {
    const heroSection = document.createElement('section');
    heroSection.className = 'hero';
    heroSection.innerHTML = `
    <div class="container">
        <div class="hero__container">
            <a href="#/favourite" class="hero__link">
                <span class="hero__link-text">Избранное</span>
                <svg class="hero__icon">
                    <use xlink:href="/image/sprite.svg#star-ow" />
                </svg>
            </a>
            <svg class="hero__logo" viewBox="0 0 360 48" role="img" aria-label="Логотип сервиса You-Tvideo">
                <use xlink:href="/image/sprite.svg#logo-white" />
            </svg>
            <h1 class="hero__title">Смотри. Загружай. Создавай</h1>
            <p class="hero__tagline">Удобный видеохостинг для тебя</p>
        </div>
    </div>
    `;
    return heroSection;
}

const createSearch = () => {
    const searchSection = document.createElement('section');
    const container = document.createElement('div');
    const title = document.createElement('h2');
    const form = document.createElement('form');

    searchSection.className = 'search';
    container.className = 'container';
    title.className = 'visually-hidden';
    title.textContent = 'Поиск';
    form.className = 'search__form';
    form.innerHTML = `
        <input type="search" name="search" class="search-input" placeholder="Найти видео..." required>
        <button class="search__btn" type="submit">
            <span>поиск</span>
            <svg class="search__icon">
                <use xlink:href="/image/sprite.svg#search" />
            </svg>
        </button>
    `;
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        if(form.search.value) {
            router.navigate(`/search?q=${form.search.value.trim()}`);
        }
    });
    searchSection.append(container);
    container.append(title, form);

    return searchSection;
}

const createHeader = () => {
    const header = document.querySelector('.header');

    if (header) {
        return header;
    }

    const headerElement = document.createElement('header');
    headerElement.className = 'header';
    headerElement.innerHTML = `
    <div class="container header__container">
        <a class="header__link" href="/">
            <svg class="header__logo" viewBox="0 0 240 32" role="img" aria-label="Логотип сервиса You-Tvideo">
                <use xlink:href="./image/sprite.svg#logo-orange" />
            </svg>
        </a>
        <a href="#/favourite" class="header__link header__link_favourite">
            <span class="header__link-text">Избранное</span>
            <svg class="header__favourite-icon">
                <use xlink:href="./image/sprite.svg#star-ob" />
            </svg>
        </a>
    </div>
    `;
    return headerElement;
}

const createFooter = () => {
    const footer = document.querySelector('.footer');

    if (footer) {
        return footer;
    }

    const footerElement = document.createElement('footer');
    footerElement.className = 'footer';
    footerElement.innerHTML = `
    <div class="container footer__container">
        <a class="footer__link_logo" href="/">
            <svg class="footer__logo" viewBox="0 0 360 48" role="img" aria-label="Логотип сервиса You-Tvideo">
                <use xlink:href="/image/sprite.svg#logo-white" />
            </svg>
        </a>
        <div class="footer__info">
            <div class="footer__developers">
                <ul class="footer__developers-list">
                    <li class="footer__developers-item">
                        Designer: <a class="footer__developers-link" href="https://t.me/AnastasiaIlina"
                            target="_blank" rel="noopener">Anastasia Ilina</a>
                    </li>
                    <li class="footer__developers-item">
                        Developer: <a class="footer__developers-link" href="https://t.me/AIMedvedev" target="_blank"
                            rel="noopener">Aleksandr Medvedev</a>
                    </li>
                </ul>
            </div>
            <p class="copyright">© You-Tvideo, 2023</p>
        </div>
    </div>
    `;
    return footerElement;
}


preload.init();

const init = () => {
    const indexRoute = async () => {
        const hero = createHero();
        const search = createSearch();
        const videos = await fetchTrendingVideos(12);
        const videoList = createVideoList(videos, 'В тренде');

        main.textContent = '';
        preload.append();
        preload.remove();
        main.append(hero, search, videoList);
        document.body.append(createFooter());
    };

    const videoRoute = async (ctx) => {
        const search = createSearch();
        const id = ctx.data.id;
        const data = await fetchChosenVideo(id);
        const video = data.items[0];
        const videoSection = createVideo(video);

        document.body.prepend(createHeader());
        main.textContent = '';
        preload.append();
        preload.remove();
        main.append(search, videoSection);

        const searchQuery = video.snippet.title;
        const videos = await fetchSearchedVideos(searchQuery);
        const videoList = createVideoList(videos, 'Похожие видео');
        main.append(videoList);
        document.body.append(createFooter());
    };

    const favouriteRoute = async () => {
        const search = createSearch();
        const videos = await fetchFavouriteVideos(6);
        const videoList = createVideoList(videos, 'Избранное');

        main.textContent = '';
        document.body.prepend(createHeader());
        preload.append();
        preload.remove();
        main.append(search, videoList);
        document.body.append(createFooter());
    };

    const searchRoute = async (ctx) => {
        const query = ctx.params.q;
        const page = ctx.params.page;

        if (query) {
            const search = createSearch();
            const videos = await fetchSearchedVideos(query, page);
            const videoList = createVideoList(videos, 'Результаты поиска', {
                query,
                next: videos.nextPageToken,
                prev: videos.prevPageToken,
            });

            main.textContent = '';
            document.body.prepend(createHeader());
            preload.append();
            preload.remove();
            main.append(search, videoList);
            document.body.append(createFooter());
        }
    };


    router.on({
        '/': indexRoute,
        '/index': indexRoute,
        '/video/:id': videoRoute,
        '/favourite': favouriteRoute,
        '/search': searchRoute
    })
    .resolve();

    document.body.addEventListener('click', ({target}) => {
        const itemFavourite = target.closest('.favourite');

        if (itemFavourite) {
            const videoId = itemFavourite.dataset.videoId;

            if (favouriteIds.includes(videoId)) {
                favouriteIds.splice(favouriteIds.indexOf(videoId), 1);
                localStorage.setItem('favouriteVideos', JSON.stringify(favouriteIds));
                itemFavourite.classList.remove('active');
            } else {
                favouriteIds.push(videoId);
                localStorage.setItem('favouriteVideos', JSON.stringify(favouriteIds));
                itemFavourite.classList.add('active');
            }
        }
    });
}

init();