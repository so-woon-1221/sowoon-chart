import React from 'react'

interface Props {
    title: string
}

const Button = (props: Props) => {
    return <button>{props.title}</button>
}

export default Button
