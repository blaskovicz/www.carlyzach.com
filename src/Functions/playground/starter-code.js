export const starterCode = {
  typescript: `async function main(): Promise<void> {
  const message: string = "👋 hello 🌎 world";

  console.log(message);
}
  
(async () => {
  await main();
})();`,
  javascript: `function main() {
  const message = "👋 hello 🌎 world";
  console.log(message);
}

main();`,

  go: `package main

import (
	"fmt"
	"sync"
)

func main() {
	asyncHello()
}

func asyncHello() {
	results := make(chan string, 2)
	var waiter sync.WaitGroup
	waiter.Add(1)
	go func() {
		results <- "🌎 world "
		waiter.Done()
	}()
	waiter.Add(1)
	go func() {
		results <- "👋 hello "
		waiter.Done()
	}()

	waiter.Wait()
	close(results)

	for word := range results {
		fmt.Printf("%s", word)
	}
}
`
};
