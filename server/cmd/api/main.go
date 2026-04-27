package main

import "inr_helper/server/internal/router"

func main() {
	r := router.New()
	if err := r.Run(":8080"); err != nil {
		panic(err)
	}
}
