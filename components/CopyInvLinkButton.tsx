'use client'
import React from 'react'

const CopyInvLinkButton = ({ text }: { text: string }) => {
    return (
        <button
            onClick={() => { navigator.clipboard.writeText(text) }}
        >Create inv link</button>
    )
}

export default CopyInvLinkButton