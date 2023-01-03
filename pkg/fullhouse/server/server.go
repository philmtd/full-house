package server

import (
	"context"
	"errors"
	"fmt"
	"fullhouse/pkg/fullhouse/config"
	"fullhouse/pkg/fullhouse/game"
	"fullhouse/pkg/fullhouse/logger"
	"fullhouse/pkg/fullhouse/metrics"
	"fullhouse/pkg/fullhouse/models"
	"fullhouse/pkg/fullhouse/websocket"
	"github.com/gin-contrib/static"
	ginzap "github.com/gin-contrib/zap"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
	"log"
	"net/http"
	"os"
	"os/signal"
	"path"
	"syscall"
	"time"
)

type Server struct {
	log              *zap.SugaredLogger
	manager          *game.GameManager
	websocketHandler *websocket.WebsocketHandler
	ctx              context.Context
}

var appVersion string

func New(ctx context.Context, version string) Server {
	handler := websocket.NewWebsocketHandler()
	appVersion = version
	return Server{
		log:              logger.New("server"),
		manager:          game.New(handler.Hub, ctx),
		websocketHandler: handler,
		ctx:              ctx,
	}
}

func (s *Server) Start(c config.Config) {
	metrics.RegisterCommonMetrics(appVersion)

	if c.FullHouse.Mode == config.PRODUCTION {
		gin.SetMode(gin.ReleaseMode)
	} else {
		gin.SetMode(gin.DebugMode)
	}

	r := gin.New()

	r.Use(ginzap.GinzapWithConfig(s.log.Desugar(), &ginzap.Config{
		TimeFormat: time.RFC3339,
		UTC:        false,
		SkipPaths:  []string{"/up", "/metrics"},
	}))

	r.Use(static.Serve("/", static.LocalFile("frontend", true)))
	r.NoRoute(func(c *gin.Context) {
		c.File(path.Join("frontend", "index.html"))
	})

	r.GET("/metrics", metrics.PrometheusHandler())
	r.GET("/up", s.upHandler)

	api := r.Group("/api")
	api.POST("/participant/new", s.newParticipant)
	api.Any("/ws", s.wsHandler)

	gameApi := api.Group("/game")
	gameApi.GET("/votingSchemes", s.votingSchemes)
	gameApi.POST("/new", s.newGame)
	gameApi.POST("/:slug/join", s.joinGame)
	gameApi.POST("/:slug/vote", s.vote)
	gameApi.POST("/:slug/progress", s.progressToNextPhase)
	gameApi.GET("/:slug", s.getGame)

	address := fmt.Sprintf(":%d", c.FullHouse.Server.Port)
	srv := &http.Server{
		Addr:    address,
		Handler: r,
	}

	go func() {
		if err := srv.ListenAndServe(); err != nil && errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("listen: %s\n", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	s.log.Info("shutting down server")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		log.Fatal("server forced to shutdown:", err)
	}
}

func (s *Server) upHandler(ctx *gin.Context) {
	ctx.Status(http.StatusOK)
}

func (s *Server) votingSchemes(ctx *gin.Context) {
	votingSchemes := config.Configuration.FullHouse.VotingSchemes
	result := []models.VotingScheme{}
	for _, scheme := range votingSchemes {
		result = append(result, models.VotingSchemeFromConfig(scheme))
	}
	ctx.JSON(http.StatusOK, result)
}

func (s *Server) getGame(ctx *gin.Context) {
	g, err := s.manager.GetGameBySlug(ctx.Param("slug"))
	if err != nil {
		ctx.Status(http.StatusNotFound)
		return
	}
	ctx.JSON(http.StatusOK, g)
}

func (s *Server) newGame(ctx *gin.Context) {
	dto := &models.GameDTO{}
	if ctx.BindJSON(dto) != nil {
		ctx.Status(http.StatusBadRequest)
		return
	}
	createdGame := s.manager.CreateGame(dto)
	ctx.JSON(http.StatusCreated, createdGame)
}

func (s *Server) joinGame(ctx *gin.Context) {
	dto := &models.ParticipantDTO{}
	if ctx.BindJSON(dto) != nil {
		ctx.Status(http.StatusBadRequest)
		return
	}
	cookie, _ := getSessionIdCookie(ctx)
	game, err := s.manager.JoinGame(ctx.Param("slug"), dto, cookie)
	if err != nil {
		ctx.Status(http.StatusNotFound)
		return
	}
	setSessionIdCookie(ctx, dto.Id)
	ctx.JSON(http.StatusOK, game)
}

func (s *Server) vote(ctx *gin.Context) {
	dto := &models.VoteDTO{}
	if ctx.BindJSON(dto) != nil {
		ctx.Status(http.StatusBadRequest)
		return
	}
	cookie, err := getSessionIdCookie(ctx)
	if err != nil {
		ctx.Status(http.StatusBadRequest)
		return
	}
	err = s.manager.Vote(ctx.Param("slug"), dto, cookie)
	if err != nil {
		ctx.Status(http.StatusBadRequest)
		return
	}
	ctx.Status(http.StatusOK)
}

func (s *Server) progressToNextPhase(ctx *gin.Context) {
	slug := ctx.Param("slug")
	if err := s.manager.ProgressGameToNextState(slug); err != nil {
		ctx.Status(http.StatusNotFound)
	} else {
		ctx.Status(http.StatusOK)
	}
}

func (s *Server) newParticipant(ctx *gin.Context) {
	dto := &models.ParticipantDTO{}
	if ctx.BindJSON(dto) != nil {
		ctx.Status(http.StatusBadRequest)
		return
	}
	participant := s.manager.CreateParticipant(dto.Name)
	setSessionIdCookie(ctx, participant.Id)
	ctx.JSON(http.StatusOK, participant)
}

func setSessionIdCookie(ctx *gin.Context, id string) {
	ctx.SetCookie("SESSION_ID", id, 60*60*24*365, "/", ctx.Request.Host, false, false)
}

func getSessionIdCookie(ctx *gin.Context) (string, error) {
	sessionId, err := ctx.Request.Cookie("SESSION_ID")
	if err != nil {
		return "", err
	}
	return sessionId.Value, nil
}

func (s *Server) wsHandler(c *gin.Context) {
	s.websocketHandler.HandleMessages(c.Writer, c.Request)
}
