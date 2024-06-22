interface MovieModel {
  id: string;
  title: string;
  description: string;
  genre: string;
  img: string; // строка с постером фильма в base64
  release_year: number;
  screenshots: string[];
  actors: string[]; // id актеров
  averange_rate: string; // Средняя оценка
  total_rates_from_user: string; // Сколько всего пользователей оценили этот фильм
}

export default MovieModel;
