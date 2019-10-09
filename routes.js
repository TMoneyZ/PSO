module.exports = function(app) {
	app.get('/', function(request, response) {
		response.redirect('https://thedynastyleague.wordpress.com/');
	});

	app.get('/history', function(request, response) {
		var Game = require('./models/Game');

		var average = (scores) => {
			var sum = 0;

			scores.forEach(score => {
				sum += score;
			});

			return sum / scores.length;
		};

		var stdev = (scores, average) => {
			var variance = 0;

			scores.forEach(score => {
				variance += Math.pow(score - average, 2);
			});

			return Math.sqrt(variance / (scores.length - 1));
		};

		Game.find().then(games => {
			var franchises = {};
			var history = {};
			var owners = {};
			var leaders = {
				regularSeasonWins: {
					description: 'Regular Season Wins',
					franchiseIds: {}
				},
				weeklyScoringTitles: {
					description: 'Weekly Scoring Titles',
					franchiseIds: {}
				}
			};
			var stats = [];

			games.forEach(game => {
				if (!franchises[game.season]) {
					franchises[game.season] = {};
				}

				if (!franchises[game.season][game.away.franchiseId]) {
					franchises[game.season][game.away.franchiseId] = game.away.name;
				}

				if (!franchises[game.season][game.home.franchiseId]) {
					franchises[game.season][game.home.franchiseId] = game.home.name;
				}

				if (!history[game.season]) {
					history[game.season] = {};
				}

				if (!history[game.season][game.week]) {
					history[game.season][game.week] = {};
				}

				if (!history[game.season][game.week][game.away.franchiseId]) {
					history[game.season][game.week][game.away.franchiseId] = {
						franchise: game.away,
						opponent: game.home,
						type: game.type
					};
				}

				if (!history[game.season][game.week][game.home.franchiseId]) {
					history[game.season][game.week][game.home.franchiseId] = {
						franchise: game.home,
						opponent: game.away,
						type: game.type
					};
				}

				if (!owners[game.season]) {
					owners[game.season] = {};
				}

				if (!owners[game.season][game.away.franchiseId]) {
					owners[game.season][game.away.franchiseId] = game.away.name;
				}

				if (!owners[game.season][game.home.franchiseId]) {
					owners[game.season][game.home.franchiseId] = game.home.name;
				}

				if (!leaders.regularSeasonWins.franchiseIds[game.away.franchiseId]) {
					leaders.regularSeasonWins.franchiseIds[game.away.franchiseId] = 0;
				}

				if (!leaders.regularSeasonWins.franchiseIds[game.home.franchiseId]) {
					leaders.regularSeasonWins.franchiseIds[game.home.franchiseId] = 0;
				}

				if (!leaders.weeklyScoringTitles.franchiseIds[game.away.franchiseId]) {
					leaders.weeklyScoringTitles.franchiseIds[game.away.franchiseId] = 0;
				}

				if (!leaders.weeklyScoringTitles.franchiseIds[game.home.franchiseId]) {
					leaders.weeklyScoringTitles.franchiseIds[game.home.franchiseId] = 0;
				}

				if (!stats[game.season]) {
					stats[game.season] = {
						franchises: [],
						weeks: [],
						total: {
							scores: [],
							average: null,
							stdev: null
						}
					}
				}

				if (!stats[game.season].weeks[game.week]) {
					stats[game.season].weeks[game.week] = { scores: [], average: null, stdev: null };
				}

				if (!stats[game.season].franchises[game.away.franchiseId]) {
					stats[game.season].franchises[game.away.franchiseId] = { scores: [], average: null, stdev: null };
				}

				if (!stats[game.season].franchises[game.home.franchiseId]) {
					stats[game.season].franchises[game.home.franchiseId] = { scores: [], average: null, stdev: null };
				}

				if (game.type == 'regular' && game.away.score && game.home.score) {
					leaders.regularSeasonWins.franchiseIds[game.away.franchiseId] += game.away.record.straight.week.wins;
					leaders.regularSeasonWins.franchiseIds[game.home.franchiseId] += game.home.record.straight.week.wins;

					if (game.away.record.allPlay.week.losses == 0) {
						leaders.weeklyScoringTitles.franchiseIds[game.away.franchiseId] += 1;
					}

					if (game.home.record.allPlay.week.losses == 0) {
						leaders.weeklyScoringTitles.franchiseIds[game.home.franchiseId] += 1;
					}
				}

				if (game.type != 'consolation' && game.away.score && game.home.score) {
					stats[game.season].total.scores.push(game.away.score);
					stats[game.season].total.scores.push(game.home.score);

					stats[game.season].franchises[game.away.franchiseId].scores.push(game.away.score);
					stats[game.season].franchises[game.home.franchiseId].scores.push(game.home.score);

					stats[game.season].weeks[game.week].scores.push(game.away.score);
					stats[game.season].weeks[game.week].scores.push(game.home.score);
				}
			});

			stats.forEach(season => {
				season.weeks.forEach(week => {
					week.average = average(week.scores);
					week.stdev = stdev(week.scores, week.average);
				});

				season.franchises.forEach(franchise => {
					franchise.average = average(franchise.scores);
					franchise.stdev = stdev(franchise.scores, franchise.average);
				});

				season.total.average = average(season.total.scores);
				season.total.stdev = stdev(season.total.scores, season.total.average);
			});

			response.render('history', { franchises: franchises, history: history, owners: owners, leaders: leaders, stats: stats });
		});
	});
};
