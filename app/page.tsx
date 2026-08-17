'use client'
import React, { useActionState, useState } from 'react'
import { createRoom } from '../actions/create-room'
const HomePage = () => {
	const [maxPlayers, setMaxPlayers] = useState(0)
	const [state, formAction, pending] = useActionState(createRoom, {});
	const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		setMaxPlayers(Number(e.target.value));
	};

	console.log(maxPlayers)
	return (
		<div>
			<form action={formAction}>
				<span>max players</span>
				<select name="maxPlayers" defaultValue={4} onChange={handleChange}>
					<option value={1}>1</option>
					<option value={2}>2</option>
					<option value={3}>3</option>
				</select>
				<span>nick</span>
				<input name="nick" required maxLength={16} />
				<button type="submit">Create</button>
			</form>
		</div>
	)
}

export default HomePage