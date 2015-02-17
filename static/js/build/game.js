/** @jsx React.DOM */

var navigate = ReactMiniRouter.navigate;

var Game = React.createClass({displayName: "Game",
    handleStart: function (isManual) {
        $.ajax({
            type: 'POST',
            url: '/api/games/' + this.props.gameId + '/start',
            data: JSON.stringify({ manual: isManual }),
            contentType: 'application/json',
        }).done(function (response) {
            console.log('Started Game', response.data);
            this.setState({ game: response.data });
            this.checkInterval();
        }.bind(this));
    },
    handleClickNextTurn: function () {
        $.ajax({
            type: 'POST',
            url: '/api/games/' + this.props.gameId + '/turn'
        }).done(function (response) {
            this.handleGameState(response.data);
        }.bind(this));
    },
    handleGameState: function (gameState) {
        if (gameState.snakes.length === 0) {
            clearInterval(this.interval);
        }

        if (this.isMounted()) {
            this.setState({ latestGameState: gameState });
        } else {
            // If we're no longer on this page...
            this.interval = clearInterval(this.interval);
        }
    },
    handleClickContinuous: function () {
        this.interval = setInterval(this.handleClickNextTurn, 400);
    },
    tick: function (callback) {
        $.ajax({
            type: 'GET',
            url: '/api/games/' + this.props.gameId + '/gamestates/latest'
        }).done(function (response) {
            this.handleGameState(response.data);
            callback && callback();
        }.bind(this));
    },
    checkInterval: function () {
        // Start the ticker if it hasen't already
        var shouldTick = this.state.game.state === 'playing' ||
                         this.state.game.state === 'ready';

        if (shouldTick && !this.interval) {
            this.interval = setInterval(this.tick, 500);
        }
    },
    componentDidMount: function () {
        var canvas = this.refs.canvas.getDOMNode();
        $.ajax({
            type: 'GET',
            url: '/api/games/' + this.props.gameId
        }).done(function (response) {
            this.setState({ game: response.data });

            // Get latest game state
            this.tick(function () {
                // See if we need to tick the game
                this.checkInterval();
            }.bind(this));
        }.bind(this));
    },
    componentDidUpdate: function (prevProps, prevState) {
        if (!this.state.latestGameState) { return; }

        var board = this.getBoard();

        board.init(this.state.game.width, this.state.game.height);
        board.update(this.state.latestGameState);
    },
    getBoard: function () {
        if (!this.board) {
            var canvas = this.refs.canvas.getDOMNode();
            var ctx = canvas.getContext('2d');
            this.board = new Board(ctx, canvas);
        }

        return this.board;
    },
    getInitialState: function () {
        return {
            game: null,
            latestGameState: null
        };
    },
    render: function () {
        return (
            React.createElement("div", {className: "row"}, 
                React.createElement("div", {className: "col-md-9"}, 
                    React.createElement("canvas", {ref: "canvas"}, "Your browser does not support canvas")
                ), 
                React.createElement("div", {className: "col-md-3 sidebar"}, 
                    React.createElement(GameSidebar, {
                        gameId: this.props.gameId, 
                        game: this.state.game, 
                        latestGameState: this.state.latestGameState, 
                        continueous: this.handleClickContinuous, 
                        startAutomated: this.handleStart.bind(null, false), 
                        startManual: this.handleStart.bind(null, true), 
                        nextTurn: this.handleClickNextTurn})
                )
            )
        );
    }
});

var GameSidebar = React.createClass({displayName: "GameSidebar",
    render: function () {
        var snakes = '';

        if (this.props.latestGameState) {
            var snakes = this.props.latestGameState.snakes.map(function (snake, i) {
                return React.createElement("li", {key: 'a_' + i}, snake.name, " (", snake.coords.length, ")");
            });
            var deadSnakes = this.props.latestGameState.dead_snakes.map(function (snake, i) {
                return React.createElement("li", {key: 'd_' + i}, snake.name, " (", snake.coords.length, ")");
            });
        }
        var buttons;

        if (!this.props.game) {
            buttons = ('');
        } else if (this.props.game.state === 'created') {
            buttons = (
                React.createElement("div", null, 
                    React.createElement("button", {className: "btn btn-success stretch", onClick: this.props.startAutomated}, 
                        "Start Automated"
                    ), 
                    React.createElement("br", null), 
                    React.createElement("br", null), 
                    React.createElement("button", {className: "btn btn-success stretch", onClick: this.props.startManual}, 
                        "Start Debug"
                    )
                )
            );
        } else if (this.props.game.state === 'manual') {
            buttons = (
                React.createElement("div", null, 
                    React.createElement("button", {className: "btn btn-success stretch", onClick: this.props.nextTurn}, 
                        "Next Turn"
                    )
                    
                    /*<br />
                    <br />
                    <button className="btn btn-success stretch" onClick={this.props.continueous}>
                        Continueous
                    </button>
                    */
                )
            );
        } else {
            // no buttons for real games
        }

        return (
            React.createElement("div", {className: "game-sidebar sidebar-inner"}, 
                React.createElement("h3", null, this.props.gameId), 

                React.createElement("p", null, "Living Snakes"), 
                React.createElement("ul", null, snakes), 

                React.createElement("p", null, "Dead Snakes"), 
                React.createElement("ul", null, deadSnakes), 

                React.createElement("hr", null), 

                buttons
            )
        );
    }
});


var GameList = React.createClass({displayName: "GameList",
    componentDidMount: function () {
        $.ajax({
            type: 'GET',
            url: '/api/games',
        }).done(function (response) {
            this.setState({ games: response.data });
        }.bind(this));
    },
    getInitialState: function () {
        return { games: this.props.games || [] };
    },
    render: function () {
        var games = this.state.games.map(function (game, i) {
            var path = '/play/games/' + game._id
            return (
                React.createElement("li", {key: game._id}, React.createElement("a", {href: path}, game._id))
            );
        });

        return (
            React.createElement("div", null, 
                React.createElement("h2", null, "Current Games"), 
                React.createElement("ul", null, games)
            )
        );
    }
});

var GameCreate = React.createClass({displayName: "GameCreate",
    handleGameCreate: function (e) {
        e.preventDefault();

        var gameData = { snake_urls: this.state.snakeUrls };

        $.ajax({
            type: 'POST',
            url: '/api/games',
            data: JSON.stringify(gameData),
            contentType: 'application/json'
        }).done(function (response) {
            navigate('/play/games/' + response.data.game._id);
        }).error(function (xhr, textStatus, errorThrown) {
            alert(xhr.responseJSON.message);
        });
    },
    handleAddSnakeUrl: function (e) {
        var snakeUrls = this.state.snakeUrls;
        snakeUrls.push('');
        this.setState({ snakeUrls: snakeUrls });
    },
    handleSnakeUrlChange: function (i, e) {
        var snakeUrls = this.state.snakeUrls;
        snakeUrls[i] = e.target.value;

        this.setState({ snakeUrls: snakeUrls });
    },
    getInitialState: function () {
        return { snakeUrls: [''] };
    },
    render: function () {
        var snakeUrls = this.state.snakeUrls.map(function (snakeUrl, i) {
            return (
                React.createElement("div", {className: "form-group", key: 'url_' + i}, 
                    React.createElement("input", {type: "text", 
                        className: "form-control", 
                        value: this.state.snakeUrls[i], 
                        name: "snake-url", 
                        id: "snake-url", 
                        autoComplete: "on", 
                        placeholder: "http://my-snake-url.com/api", 
                        onChange: this.handleSnakeUrlChange.bind(this, i)})
                )
            );
        }.bind(this));

        return (
            React.createElement("form", {onSubmit: this.handleGameCreate, id: "create-game-form"}, 
                React.createElement("h3", null, "New Game"), 
                snakeUrls, 
                React.createElement("div", {className: "form-group"}, 
                    React.createElement("button", {type: "button", 
                        onClick: this.handleAddSnakeUrl, 
                        className: "btn btn-info form-control"}, "Add Snake")
                ), 
                React.createElement("div", {className: "form-group"}, 
                    React.createElement("button", {type: "submit", className: "btn btn-success form-control"}, 
                        "Create Game"
                    )
                )
            )
        );
    }
});

