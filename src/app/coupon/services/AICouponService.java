package tn.esprit.realestateservice.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.http.MediaType;
import tn.esprit.realestateservice.entity.Coupon;
import tn.esprit.realestateservice.repository.CouponRepository;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AICouponService {

    private final CouponRepository couponRepository;

    private static final String API_KEY = "VOTRE_CLE_API_CLAUDE";
    private static final String API_URL = "https://api.anthropic.com/v1/messages";

    public String analyzeCoupons() {
        List<Coupon> coupons = couponRepository.findAll();

        String couponData = coupons.stream().map(c -> String.format(
            "Code: %s | Titre: %s | Categorie: %s | Reduction: %s%s | Usage: %d/%d | Actif: %s | Expire: %s | Jours restants: %d",
            c.getCode(), c.getTitle(), c.getCategory(),
            c.getDiscountType().name().equals("PERCENTAGE") ? c.getDiscountValue() + "%" : c.getDiscountValue() + " DT",
            "", c.getCurrentUsage(), c.getMaxUsage(),
            c.getIsActive() ? "Oui" : "Non",
            c.getExpirationDate().toString(),
            ChronoUnit.DAYS.between(LocalDateTime.now(), c.getExpirationDate())
        )).collect(Collectors.joining("\n"));

        String prompt = "Tu es un expert marketing pour une plateforme etudiante CoCo. " +
            "Analyse ces coupons et donne des recommandations concretes en francais. " +
            "Pour chaque coupon, indique : performance, risques, et actions a prendre. " +
            "Termine par 3 recommandations generales pour ameliorer la strategie coupons.\n\n" +
            "Voici les coupons:\n" + couponData;

        return callClaudeAPI(prompt);
    }

    private String callClaudeAPI(String prompt) {
        try {
            RestClient restClient = RestClient.create();

            Map<String, Object> body = Map.of(
                "model", "claude-sonnet-4-20250514",
                "max_tokens", 1500,
                "messages", List.of(Map.of("role", "user", "content", prompt))
            );

            String response = restClient.post()
                .uri(API_URL)
                .header("x-api-key", API_KEY)
                .header("anthropic-version", "2023-06-01")
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .body(String.class);

            // Extraire le texte de la reponse JSON
            if (response != null && response.contains("\"text\"")) {
                int start = response.indexOf("\"text\":\"") + 8;
                int end = response.indexOf("\"", start);
                // Gerer les textes longs avec des guillemets echappes
                StringBuilder text = new StringBuilder();
                boolean escaped = false;
                for (int i = start; i < response.length(); i++) {
                    char ch = response.charAt(i);
                    if (escaped) {
                        if (ch == 'n') text.append('\n');
                        else text.append(ch);
                        escaped = false;
                    } else if (ch == '\\') {
                        escaped = true;
                    } else if (ch == '"') {
                        break;
                    } else {
                        text.append(ch);
                    }
                }
                return text.toString();
            }
            return response;
        } catch (Exception e) {
            return "Erreur d'analyse IA: " + e.getMessage();
        }
    }
}