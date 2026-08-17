'use client'
import React, { useActionState, useState } from 'react'
import { createRoom } from '../actions/create-room'
const HomePage = () => {

	const [state, formAction, pending] = useActionState(createRoom, {});

	return (
		<div>
			<form action={formAction}>
				<span>max players</span>
				<select name="maxPlayers" defaultValue={4}>
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