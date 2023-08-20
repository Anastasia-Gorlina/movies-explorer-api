const movieSchema = require('../models/movie');
const NotFoundError = require('../errors/not-found-error');
const BadRequestError = require('../errors/bad-request-error');
const ForbiddenError = require('../errors/forbidden-error');

module.exports.getMovies = (request, response, next) => {
  const owner = request.user._id;

  movieSchema.find({ owner })
    .then((cards) => {
      response.status(200).send(cards);
    })
    .catch((err) => {
      throw new NotFoundError(err.message);
    })
    .catch(next);
};

// удаляет фильм по _id
module.exports.deleteMovie = (request, response, next) => {
  const { id } = request.params;
  // console.log(request.params);
  // console.log(request.user._id);
  movieSchema.findById(id)
    .orFail(() => new NotFoundError(`Фильм с id ${id} не найден`))
    .then((movie) => {
      if (!movie.owner.equals(request.user._id)) {
        return next(new ForbiddenError('Недостаточно прав для удаления этого фильма'));
      }
      return movie.remove()
        .then(() => response.send({ message: 'Фильм удален' }));
    })
    .catch(next);
};

// создаёт фильм
module.exports.createMovie = (request, response, next) => {
  const {
    country, director, duration,
    year, description, image, trailerLink,
    thumbnail, movieId, nameRU, nameEN,
  } = request.body; // получим из объекта запроса название и ссылку фильма
  console.log(request.body);
  const owner = request.user._id;
  return movieSchema.create({
    country,
    director,
    duration,
    year,
    description,
    image,
    trailerLink,
    thumbnail,
    owner,
    movieId,
    nameRU,
    nameEN,
  }) // создадим фильм на основе пришедших данных
    .then((movie) => response.status(201).send({ data: movie })) // вернём записанные в базу данные
    .catch((error) => {
      if (error.name === 'ValidationError') {
        next(new BadRequestError(`${Object.values(error.errors).map((err) => err.message).join(', ')}`));
      } else {
        next(error); // Для всех остальных ошибок
      }
    });
};
