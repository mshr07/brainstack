import io.gatling.core.Predef._
import io.gatling.http.Predef._

class BankingSimulation extends Simulation {
  val httpProtocol = http.baseUrl("http://localhost:8081")
  val scn = scenario("Market data smoke")
    .exec(http("list instruments").get("/api/v1/instruments"))

  setUp(scn.inject(atOnceUsers(1))).protocols(httpProtocol)
}
