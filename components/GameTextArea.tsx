import React from 'react'

type GameTextArea = {
    raceText: string 
}
const GameTextArea = ({ raceText }: GameTextArea) => {
    return (
        <div>{raceText}</div>
    )
}

export default GameTextArea