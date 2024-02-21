$('#promotions_server').on('change', function() {
    GetPromotions();
});
function GetPromotions() {
	if ( $('#promotions_list').length ) {
		$.ajax({
			url: '/ajax/get_promotions',
			type: 'POST',
			dataType: "text",
			data: {
	            id: $('#promotions_server').val()
	        },
			success: function(data) {
				$('#promotions_list').html(data);
				countdown();
			}
		});
	}
}
function countdown() {
	$('.countdown').each(function() {
		var t = $(this);
		var countDownDate = new Date(t.data('time') ).getTime();
		setInterval(function() {
			var now = new Date().getTime();
			var distance = countDownDate - now;
			var days = Math.floor(distance / (1000 * 60 * 60 * 24));
			var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
			var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
			var seconds = Math.floor((distance % (1000 * 60)) / 1000);
			t.html(days + "д " + hours + "ч " + minutes + "м " + seconds + "с ");
			if (distance < 0) {
				window.reload();
			}
		}, 1000);
	});
}
$(document).on('click', '.promotion_button', function() {
    var id = $(this).data('id');
    OpenBuyModal();
    var modal = $('#item_modal');
    modal.find('.name span').html('"'+ $(this).attr('data-name') + '"');
    modal.find('#modal_price span').html( $(this).attr('data-price') + " руб.");
    modal.find('input[name="id"]').val($(this).attr('data-id'));
    modal.find('input[name="server"]').val($('#promotions_server').val());
	modal.find('input[name="promotion"]').val('1');
	updateBuyModal(modal, null);

});

$("#item_modal #donate-info input.input").on('keyup', function() {
    $('#item_modal').find('.check_info').hide();
	$('#item_modal').find('input[name=checking]').val('1');
	$('#item_modal').find('input[name=payment-method]').val('');
	$('#item_modal').find('input[name=payment-operator]').val('');
	$('#item_modal #donate-info .action button').html('Проверить');
	$('#item_modal #donate-info .action button').removeAttr("type").attr("type", "submit");
});
var blockPay = false;
$('#buy_form').submit(function(event) {

	event.preventDefault();
	if (blockPay) return;
	blockPay = true;
	$.ajax({
		url: '/ajax/buy_product',
		type: 'POST',
		dataType: "text",
		data: $(this).serialize(),
		success: function(data) {
			data = $.parseJSON(data);
            if(data.status !== 'error' && data.status !== 'check' && data.status !== 'warning' && data.status !== "old_payment" &&  data.status !== "warning-redirect") {
                window.location = data.url;
				//$('#unitpay_script').remove();
				//$('body').append(data.script);
				return;
			}
			blockPay = false;
		 if(data.status === 'check') {
				var text = '';
				if (data.tok !== 0) {
					text += '<p>Вы получите: <span>'+data.tok+' токенов</span></p>';
				}
                if (data.bal !== 0) {
                    text += '<p>Вы получите: <span>'+data.bal+' баланса биржи</span></p>';
                }
				if (data.bonus !== 0) {
					text += '<p><span>(</span>+'+data.bonus+' <span>Токенов бонусом)</span></p>';
				}
				if (data.promo !== 0) {
					text += '<p>Скидка по промокоду: <span>-' + data.promo + ' руб.</span></p>';
				}
				if (data.charger !== 0) {
					text += '<p>Ваша доплата: <span>-' + data.charger + ' руб.</span></p>';
				}
				if (text !== '') {
					$('#buy_form').find('.check_info').html(text).show();
				}
				$('#modal_price span').html(data.total_price+' руб.');

				$('#item_modal').find('input[name=checking]').val('0');
				$('#item_modal #donate-info .action button').html('Приобрести');
				$('#item_modal #donate-info .action button').removeAttr("type").attr("type", "button");
				if (text === '') {
					$('#item_modal #donate-info .action button').effect("shake", {}, "slow");
				}
			} else if (data.status === 'old_payment') {

				Swal.fire({
					title: 'Осторожно!',
					text: "Найден незавершённый платёж! Хотите ли вы его удалить? Если вы заплатили за товар, а он не пришел, не в коем случае не удаляйте платеж!",
					icon: 'warning',
					showCancelButton: true,
					confirmButtonColor: '#3085d6',
					cancelButtonColor: '#d33',
					cancelButtonText: 'Нет',
					confirmButtonText: 'Да, удалить'
				}).then(function(result) {
					if (result.isConfirmed) {
						$.ajax({
							url: '/ajax/delete_payment',
							type: 'POST',
							dataType: "text",
							data: "phone="+data.phone+"&sum="+data.sum,
							success: function(data) {
								$('#buy_form').submit();
							}
						})
					}
				})

			} else if (data.status === "warning-redirect") {
				Swal.fire({title:data.title, text:data.message, type:"info"}).then(function() {
					window.location = $.parseJSON(data.url).url;
				});
			}
            else {
                Swal.fire(data.title, data.message, data.status);
            }
		}
	});
});
$(document).on('click', '#buy_button', function() {
    var id = $(this).data('id');
	var type = $(this).data('type');
    OpenBuyModal();
    var modal = $('#item_modal');
    modal.find('.name span').html('"'+ $(this).attr('data-name') + '"');
    modal.find('#modal_price span').html( $(this).attr('data-price') + " руб.");
    modal.find('input[name="id"]').val($(this).attr('data-id'));
    modal.find('input[name="server"]').val($('#server').val());
    modal.find('input[name="method"]').val($(this).attr('data-method'));
	updateBuyModal(modal, type);

});
function updateBuyModal(modal, type) {
	modal.find('#enter_promo').detach().insertAfter($('#input_nick'));
	modal.find('#enter_promo').css("padding-right", "");
	modal.find('#enter_amount').detach().insertBefore($('#enter_amount_2'));

    if (type === "token") {
		modal.find('#g_inputs').css("display", "");
		modal.find('#g_inputs #enter_amount').css("display", "").css("padding-right", '5px').css("padding-left", '');
		modal.find('#g_inputs #enter_amount input').attr("placeholder", "Сумма в рублях")
		modal.find('#g_inputs #enter_amount_2').css("display", "");
		modal.find('#g_inputs #enter_amount_2 input').attr("placeholder", "Кол-во токенов")
	} else if (type==="multiple" || type === "token2") {
		modal.find('#g_inputs').css("display", "");
		modal.find('#g_inputs #enter_amount').css("display", "").css("padding-right", '').css("padding-left", "5px");
		modal.find('#enter_promo').detach().insertBefore($('#enter_amount'));
		modal.find('#g_inputs #enter_promo').css("padding-right", "5px");
		modal.find('#g_inputs #enter_amount_2').css("display", "none");
		modal.find('#g_inputs #enter_amount input').attr("placeholder", type === "token2" ?"Кол-во баланса" : "Кол-во товара")
	} else {
		modal.find('#g_inputs').css("display", "none");
	}
}
$(document).on('click', '.payment-btn', function() {
	var method = $(this).attr('data-method');
	var operator = $(this).attr('data-operator');
	var modal = $('#item_modal');
	modal.find('input[name="payment-method"]').val(method);
	modal.find('input[name="payment-operator"]').val(operator);

	var good = modal.find(".name span").first().html();
	var name = modal.find("input[name=nick]").val();

	if ($(this).attr('data-additional')) {
		hideAll();
		$("#additional_info").show();
		$("#additional_info").find('.asd').html("<span>Покупка:</span> " + good + " для " + name);
		return;
	} else {
		modal.find('input[name="email"]').val('');
	}

	//modal.submit();
	$('#buy_form').submit();
});

$(document).on('click', '#item_modal .action button', function() {

	if ($(this).attr("data-ind") === "method_button") {
		if ($(this).attr("type") !== "button") {
			return;
		}
		showMethodSelect();
	}

	if ($(this).attr("data-ind")==="add_button") {
		console.log("ok")
		$('#buy_form').submit();
	}
});


function showMethodSelect() {
	hideAll();
	$("#payment-method").show();
	if ($("#buy_form").height() > $(window).height() ) {
		$("#buy_form").css('height', '100%').css('overflow-y', 'auto');
	}
}

function hideAll() {
	$("#donate-info").hide();
	$("#additional_info").hide();
	$("#payment-method").hide();
	$("#buy_form").css('height', '').css('overflow-y', '');
}

$('.close_bModal').click(function() {
	blockPay = false;

	if ($(this).attr("data-type") === "methods") {
		hideAll();
		$("#donate-info").show();
		return;
	}
	if ($(this).attr("data-type") === "add_info") {
		showMethodSelect();
		return;
	}
    $('#item_modal').fadeOut();
	$('body').removeClass('overflow_hide');
	//reset
	$('#item_modal input').each(function() {
		$(this).val('');
		if($(this).attr('type') == 'checkbox') {
			$(this).prop('checked', false);
		}
	});
	$('#item_modal').find('.check_info').hide();
	$('#item_modal').find('input[name=checking]').val('1');
	$('#item_modal').find('input[name=promotion]').val('0');
	$('#item_modal #donate-info .action button').html('Проверить');
	$('#item_modal #donate-info .action button').removeAttr("type").attr("type", "submit");
});

$(function() {
    ///
    GetItems();
    ///
	GetPromotions();
});

$("#enter_amount_2 :input").on('propertychange input', function (e) {
	var inp = $("#enter_amount_2 :input");
	var val = fixVal(inp).val();
	if (isChanged(e)) {
		if (val.length > 0 && val > 0) {
			$("#enter_amount :input").val(Math.round(val / 100));
		} else {
			$("#enter_amount :input").val('');
			inp.val('');
		}
	}
});

$("#enter_amount :input").on('propertychange input', function (e) {
	if ($('#enter_amount_2').is(":hidden")) {
		return;
	}
	var inp = $("#enter_amount :input");
	var val = fixVal(inp).val();
	if (isChanged(e)) {
		if (val.length > 0 && val > 0) {
			$("#enter_amount_2 :input").val(val * 100);
		} else {
			$("#enter_amount_2 :input").val('');
			inp.val('');
		}
	}
});

function fixVal(inp) {
	inp.val(inp.val().replace(/[^0-9]/g, ''))
	return inp;
}

function isChanged(e) {
	var valueChanged = false;

	if (e.type=='propertychange') {
		valueChanged = e.originalEvent.propertyName=='value';
	} else {
		valueChanged = true;
	}
	return valueChanged;
}
$('#server').on('change', function() {
    GetItems();
});
$(document).on('click', '#items_list .item', function() {
    var info = $(this).data('info');

	var infoh =  $('#item_info');
	infoh.html(info);
    $(this).siblings().removeClass('active');
    $(this).addClass('active');


	if (selectedMethod !== null && infoh.has('#method_select').length != 0 && $("#method_select p[data-id=\""+selectedMethod+"\"]").length > 0) {
		$("#method_select").find('p').removeClass("active");

		var method = $("#method_select p[data-id=\""+selectedMethod+"\"]");
		method.addClass("active");
		var price = method.data('price');
		$('#info_price .price span').html(price + ' руб');
		$('#buy_button').attr('data-price', price);
		$('#buy_button').attr('data-method', method.data('id'));
	}

	if( $(window).width() < 700 ) {
        $('html').animate({
            scrollTop: $('#item_info').offset().top
        }, 500);
	}
});

var selectedMethod;

$(document).on('click', '#method_select p', function() {
    var price = $(this).data('price');
    $(this).siblings().removeClass('active');
    $(this).addClass('active');
    $('#info_price .price span').html(price + ' руб');

	selectedMethod =  $(this).data('id');

    $('#buy_button').attr('data-price', price);
    $('#buy_button').attr('data-method', $(this).data('id'));
});
function GetItems() {
	if ( $('#items_list').length ) {
		$.ajax({
			url: '/ajax/get_items',
			type: 'POST',
			dataType: "text",
			data: {
	            id: $('#server').val()
	        },
			success: function(data) {
				try {
					data = $.parseJSON(data);
					if (data.status === 'error') {
						$('#items_list').html(data.message);
						$('#item_info').html(data.message);
						$('#items_list').siblings('.title').hide();
					} else if (data.status === 'success') {
						$('#items_list').html(data.items_list);
						$('#item_info').html(data.item_info);
						$('#items_list').siblings('.title').show();
					} else {
						Swal.fire(data.title, data.message, data.status);
					}
				} catch (e) {
					console.log(e);
					GetItems();
					return;
				}
			},
			 error: function (data) {
				console.log(data);
				GetItems();
			 }
		});
	}
}

$('#g_buy').click(function() {
   if($(this).is(":checked")) {
       $('#sender_input').show();
   }
   else if($(this).is(":not(:checked)")) {
       $('#sender_input').hide();
   }
});
function OpenBuyModal() {
    $('#item_modal').fadeIn();
	$('body').addClass('overflow_hide');
}

$('.copy.clipboard').click(function() {
    var copy = $(this);
    copy.addClass('ok')
    setTimeout(function() {
        copy.removeClass('ok')
    }, 2000)
});
new ClipboardJS('.copy.clipboard');

if (window.location.pathname !== "/dogovor_oferti") {

	$('.rule_box .head').click(function () {
		$(this).siblings('.rule_content').slideToggle();
		$(this).find('.box_status.active').removeClass('active').siblings('.box_status').addClass('active');
	});
} else {
	$('.rule_box .head').siblings('.rule_content').show();
}

$('.open_menu').click(function() {
	$('.mobile_menu').fadeIn();
	$('body').addClass('overflow_hide');
});
$('.menu_close').click(function() {
	$('.mobile_menu').fadeOut();
	$('body').removeClass('overflow_hide');
});

