package ai.nextintern.security;

import org.jsoup.Jsoup;
import org.jsoup.safety.Safelist;

public final class SanitizationUtils {

    private SanitizationUtils() {
    }

    // Strict: removes ALL HTML
    public static String strict(String input) {
        if (input == null)
            return null;
        return Jsoup.clean(input, Safelist.none());
    }

    // Basic formatting allowed (bold, italics, lists)
    public static String basicFormatting(String input) {
        if (input == null)
            return null;
        return Jsoup.clean(input, Safelist.basic());
    }
}
