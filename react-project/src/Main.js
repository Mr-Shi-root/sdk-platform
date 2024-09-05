function Greeting({name}) {
    return  (
        <>
            <p>Hello {name}</p>
        </>
    )
}

function Child() {
    let list = {}
    return (
        <>
            子组件
            {list.map(item => <div key={item.id}>{item.name}</div>)}
        </>
    )
}

function Main() {
    return (
        <>
            <Greeting name="world"/>
            <Greeting name="React"/>
            <Child/>
        </>
    )
}

export default Main