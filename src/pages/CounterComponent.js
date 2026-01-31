import React, { useState, useEffect } from 'react';

const CounterComponent = () => {
//function Counter() {
// this is like creating a constructor with variables
  const [count, setCount] = useState(0);
  const [myname, setMyname] = useState("Ayo");

  //useEffect is needed when u want to 
  // do things that are external to the 
  // component after component render or 
  // state (variable) change
  useEffect(() => {
    console.log("The count changed to:", count);
  }, [count]);

  return (
    <div>
      <br></br>
      <br></br>      
      <br></br>
      <p>Put Count here now: {count}</p>
      <p>Put my name here after press button: {myname}</p>
      <button onClick={() => setCount(count + 1)}>
        Press Counter Button
      </button>
      <br></br>
      <br></br>
      <button onClick={() => setMyname("Ogunyemi")}>
        Press Lastname Button
      </button>

    </div>
  );
}

export default CounterComponent;
