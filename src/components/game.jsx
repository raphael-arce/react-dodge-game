import React, {Component} from 'react';

const KEY = { //Keyboard key codes
    LEFT: 37,
    RIGHT: 39,
    UP: 38,
    DOWN: 40
}

const maxSize = 260 //size of the board

class Game extends Component {

    constructor() {
        super();
        this.canvasRef = React.createRef();
        this.state = {
            ship: {
                x: 120,
                y: 120,
                width: 20,
                height: 20
            },
            bullets: [],
            score: 0,
            highScore: 0,
            touchStart: undefined
        }
        this.draw = this.draw.bind(this)
        this.startGame = this.startGame.bind(this)
    }

    componentDidMount() {
        window.addEventListener('keydown', this.handleKeys.bind(this, true)); //add a listener for the keydown event
        //window.addEventListener('touchmove', this.handleTouch.bind(this, false)) //add a listener 
        window.addEventListener('touchstart', this.handleTouchStart.bind(this, false)) //add a listener 
        window.addEventListener('touchend', this.handleTouchEnd.bind(this, false)) //add a listener 
        this.startGame(); //begin the game!
    }

    componentWillUnmount() {
        //remove all intervals
        clearInterval(this.accelerateInterval); 
        clearInterval(this.generationInterval);
        clearInterval(this.updateInterval);
        clearInterval(this.detectionInterval);
    }
    /**
     * Begin the game, reset state and initialize intervals
     */
    startGame() {
        this.setState({
            ship: {
                x: 120,
                y: 120,
                width: 20,
                height: 20
            },
            bullets: [],
            score: 0
        }), () => {
            this.draw()
        }
        this.accelerateInterval = setInterval(() => this.accelerateGame(), 7500)
        this.generationIntervalDuration = 1000
        this.generationInterval = setInterval(() => this.generateNewBullet(), this.generationIntervalDuration)
        this.updateIntervalDuration = 25
        this.updateInterval = setInterval(() => this.updateBullets(), this.updateIntervalDuration)
        this.detectionInterval = setInterval(() => this.detectCollisions(), 5)
    }

    /**
     * draws the elements on the canvas
     */
    draw() {
        const context = this.canvasRef.current.getContext("2d");
        context.clearRect(0, 0, this.canvasRef.current.width, this.canvasRef.current.height); //clear it first
        context.fillStyle = "blue"; //use the color blue
        context.fillRect(this.state.ship.x, this.state.ship.y, this.state.ship.width, this.state.ship.height); //draw the player's rectangle
        for(let i = 0; i < this.state.bullets.length; i++) { //draw the bullets (in red this time!)
            let bullet = this.state.bullets[i]
            context.fillStyle = "red";
            context.fillRect(bullet.x, bullet.y, bullet.width, bullet.height)
        }
    }
    
    /**
     * Event handler for key down
     * @param value
     * @param event 
     */
    handleKeys(value, event) {
        if(event.keyCode === KEY.LEFT) this.moveHorizontally(-20)
        if(event.keyCode === KEY.RIGHT) this.moveHorizontally(20)
        if(event.keyCode === KEY.UP) this.moveVertically(-20)
        if(event.keyCode === KEY.DOWN) this.moveVertically(20)
    }

    /**
     * Event handler for touch start
     * @param value
     * @param event 
     */
    handleTouchStart(value, event) {
        this.setState({touchStart: event.changedTouches[0]})
    }
    
    /**
     * Event handelr for touch end
     * @param value
     * @param event 
     */
    handleTouchEnd(value, event) {
        if(this.state.touchStart !== undefined) {
            let currentTouch = event.changedTouches[0]
            let touchStart = this.state.touchStart
            let deltaX = Math.abs(touchStart.clientX - currentTouch.clientX)
            let deltaY = Math.abs(touchStart.clientY - currentTouch.clientY)
            
            if(deltaX > deltaY) {
                touchStart.clientX > currentTouch.clientX ? this.moveHorizontally(-20) : this.moveHorizontally(20)
            } else if (deltaX < deltaY) {
                touchStart.clientY > currentTouch.clientY ? this.moveVertically(-20): this.moveVertically(20)
            }
            this.setState({touchStart: currentTouch})
        }
    }

    /**
     * Function to move the player horizontally
     * @param value 
     */
    moveHorizontally(value) {
        let ship = this.state.ship
        if(ship.x + value <= (maxSize - 20) && ship.x + value >= 0) {
            ship.x += value 
            this.setState({ship: ship}, () => this.draw())
        }
    }

    /**
     * Function to move the player vertically
     * @param value 
     */
    moveVertically(value) {
        let ship = this.state.ship
        if(ship.y + value <= (maxSize - 20) && ship.y + value >= 0) {
            ship.y += value 
            this.setState({ship: ship}, () => this.draw())
        }
    }

    /**
     * Function to update the position of the bullets (in other words make them move)
     */
    updateBullets() {
        let bullets = this.state.bullets.reduce((filtered, bullet) => {
            if(bullet[bullet.axis] >= -20 && bullet[bullet.axis] <= maxSize) { //if the bullet trespass the game boundaries, do not store it again
                bullet.nextFrame()
                filtered.push(bullet)
            } else { //which also means you get a point on the score
                this.setState({score: this.state.score + 1})
            }
            return filtered
        }, [])
        this.setState({bullets: bullets}, () => { //update bullets in state and redraw the canvas
            this.draw()
        })
    }

    /**
     * Function to generate new bullets
     */
    generateNewBullet() { 
        let bullet = {
            axis: Math.round(Math.random()) ? 'x' : 'y', //if random number == 1 the bullet will move on x axis, 
            direction: Math.round(Math.random()) ? '+' : '-', //if random number == 1 the bullet will go positive
            width: 20,
            height: 20
        }
        if(bullet.axis === 'x') { //if the bullet moves along the x axis, use the y position of the player as fixed axis
            bullet.y = this.state.ship.y
            bullet.direction === '+' ? bullet.x = -20 : bullet.x = maxSize //the starting position is depend from the direction
        } else { //if the bullet moves along the y axis, use the x position of the player as fixed axis
            bullet.x = this.state.ship.x 
            bullet.direction === '+' ? bullet.y = -20 : bullet.y = maxSize //the starting position is depend from the direction
        }
        /**
         * Function to move to the bullet's next position
         */
        bullet.nextFrame = () => {
            bullet[bullet.axis] = eval(bullet[bullet.axis] + bullet.direction + "2")
        }
        this.setState({bullets: [... this.state.bullets, bullet]}) //update the state
    }

    /**
     * Function to detect collisions
     */
    detectCollisions() { 
        
        this.state.bullets.forEach(bullet => { //check for each bullet if the rectangle collides with the player's rectangle
            if(bullet.x < this.state.ship.x + this.state.ship.width &&
                bullet.x + bullet.width > this.state.ship.x &&
                bullet.y < this.state.ship.y + this.state.ship.height &&
                bullet.y + bullet.width > this.state.ship.y) {
                    //if it does, clear intervals, save highscore and restart the game
                    clearInterval(this.accelerateInterval)
                    clearInterval(this.updateInterval)
                    clearInterval(this.generationInterval)
                    clearInterval(this.detectionInterval)
                    this.state.score > this.state.highScore ? this.setState({highScore: this.state.score}, () => {this.startGame()}) : this.startGame()
            }
        })
    }

    /**
     * Function to make bullets being spawned faster with higher velocity
     */
    accelerateGame() {
        clearInterval(this.updateInterval)
        this.updateIntervalDuration = Math.round(this.updateIntervalDuration/1.2)
        this.updateInterval = setInterval(() => this.updateBullets(), this.updateIntervalDuration)

        clearInterval(this.generationInterval)
        this.generationIntervalDuration = Math.round(this.generationIntervalDuration/1.2)
        this.generationInterval = setInterval(() => this.generateNewBullet(), this.generationIntervalDuration)
        
    }

    render() {
        return (
            <div style={{position: 'fixed', height: '100%', overflow: 'hidden', width: '100%'}}>
                <h4>Use arrows or swipes to move</h4>
                <canvas ref={this.canvasRef} width={maxSize} height={maxSize} style={{border: "1px solid black"}} />
                <br/>
                Score: {this.state.score*10} | Highscore: {this.state.highScore*10}
            </div>
        );
    }
}

export default Game;